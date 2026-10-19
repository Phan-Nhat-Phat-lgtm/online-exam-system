"""
Module AI tích hợp cho hệ thống thi trực tuyến.

Tính năng 1: Tạo câu hỏi trắc nghiệm từ nội dung bài học bằng Google Gemini.
- Gọi API Gemini với prompt chuẩn sư phạm
- Xuất đúng định dạng import của hệ thống (Câu n: / A-D / Đáp án: X)
- Parse kết quả về danh sách Question, lưu thẳng vào ngân hàng đề

Env cần cấu hình trên server: GEMINI_API_KEY (tại https://aistudio.google.com/apikey)
Tuỳ chọn: GEMINI_MODEL (mặc định gemini-3.8-flash)
"""
import json
import os
import re
import urllib.request
import urllib.error

from .models import Question, QuestionBank

GEMINI_DEFAULT_MODEL = "gemini-3.8-flash"

# Các pattern parse lấy từ importer.py để AI sinh đúng chuẩn hệ thống đang dùng
Q_PATTERN = re.compile(r'^(?:Câu|câu)\s*(\d+)[\:\.]?\s*(.*)', re.IGNORECASE)
OPT_PATTERNS = {
    'option_a': re.compile(r'^[A][\.\)\/\:\s]\s*(.*)', re.IGNORECASE),
    'option_b': re.compile(r'^[B][\.\)\/\:\s]\s*(.*)', re.IGNORECASE),
    'option_c': re.compile(r'^[C][\.\)\/\:\s]\s*(.*)', re.IGNORECASE),
    'option_d': re.compile(r'^[D][\.\)\/\:\s]\s*(.*)', re.IGNORECASE),
}
ANS_PATTERN = re.compile(r'^(?:Đáp án|ĐÁP ÁN|Key|Đáp án đúng|Câu trả lời)\s*[\:\=\s]*([A-D])(?:\s|$)', re.IGNORECASE)


def call_gemini(prompt, temperature=0.7):
    """Gọi Gemini API và trả về text kết quả."""
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        raise RuntimeError('Chưa cấu hình GEMINI_API_KEY trên server.')
    model = os.environ.get('GEMINI_MODEL', GEMINI_DEFAULT_MODEL)

    payload = json.dumps({
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': temperature},
    }).encode('utf-8')

    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
    req = urllib.request.Request(
        url, data=payload, headers={'Content-Type': 'application/json'}, method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', errors='replace')[:300]
        raise RuntimeError(f'Gemini API lỗi {e.code}: {detail}')

    text = ''
    try:
        text = data['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError):
        raise RuntimeError('Gemini không trả về nội dung hợp lệ.')
    return text


def parse_questions_from_text(text):
    """Parse text AI về list dict {content, option_a..d, correct_answer}."""
    questions = []
    current = None
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        ans_match = ANS_PATTERN.match(line)
        if ans_match and current:
            current['correct_answer'] = ans_match.group(1).upper()
            if all(current.get(k) for k in ('content', 'option_a', 'option_b', 'option_c', 'option_d')):
                questions.append(current)
            current = None
            continue
        opt_matched = False
        for field, pattern in OPT_PATTERNS.items():
            m = pattern.match(line)
            if m and current:
                current[field] = m.group(1).strip()
                opt_matched = True
                break
            elif m and not current:
                opt_matched = True
                break
        if opt_matched:
            continue
        q_match = Q_PATTERN.match(line)
        if q_match:
            # Câu hỏi mới
            current = {
                'content': q_match.group(2).strip(),
                'option_a': '', 'option_b': '', 'option_c': '', 'option_d': '',
                'correct_answer': '',
            }
    return questions


def generate_questions_with_ai(content, count=10, subject=''):
    """Sinh câu hỏi trắc nghiệm từ nội dung bài học. Trả về (questions, raw_text)."""
    subject_txt = f' cho môn {subject}' if subject else ''
    prompt = f"""Bạn là chuyên gia xây dựng ngân hàng câu hỏi trắc nghiệm cho giáo viên Việt Nam.
Từ nội dung bài học dưới đây, hãy soạn {count} câu hỏi trắc nghiệm 4 đáp án (A, B, C, D) BẰNG TIẾNG VIỆT{subject_txt}.

QUAN TRỌNG - Xuất kết quả theo ĐÚNG định dạng sau (không thêm lời dẫn, không dùng markdown, mỗi câu cách nhau một dòng trống):
Câu 1: <nội dung câu hỏi>
A. <đáp án>
B. <đáp án>
C. <đáp án>
D. <đáp án>
Đáp án: <X>

Yêu cầu chất lượng:
- Câu hỏi bám sát nội dung bài học, rõ ràng, chỉ hỏi một ý duy nhất
- Đáp án đúng phân bố đều giữa A/B/C/D
- Các đáp án nhiễu phải hợp lý (dựa trên lỗi thường gặp của học sinh), tránh đáp án sai vô lý
- Độ khó phân bố: khoảng 40% dễ, 40% trung bình, 20% khó

NỘI DUNG BÀI HỌC:
{content[:15000]}

Xuất {count} câu hỏi theo đúng định dạng trên:"""

    raw = call_gemini(prompt, temperature=0.7)
    questions = parse_questions_from_text(raw)
    return questions, raw


def save_ai_questions(questions, bank_id):
    """Lưu danh sách câu hỏi AI vào ngân hàng. Trả về số câu đã lưu."""
    bank = QuestionBank.objects.get(id=bank_id)
    saved = 0
    for q in questions:
        if not q.get('correct_answer'):
            continue
        Question.objects.create(
            bank=bank,
            content=q['content'],
            option_a=q['option_a'],
            option_b=q['option_b'],
            option_c=q['option_c'],
            option_d=q['option_d'],
            correct_answer=q['correct_answer'],
        )
        saved += 1
    return saved
