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


# Model dự phòng khi model chính quá tải (503/429) hoặc chậm đáp ứng
FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite']


def _gemini_models():
    primary = os.environ.get('GEMINI_MODEL', GEMINI_DEFAULT_MODEL)
    return [primary] + [m for m in FALLBACK_MODELS if m != primary]


def _post_gemini(payload, per_model_timeout=30):
    """Gửi yêu cầu tới Gemini, tự thử lần lượt model dự phòng khi gặp quá tải."""
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        raise RuntimeError('Chưa cấu hình GEMINI_API_KEY trên server.')

    errors = []
    for model in _gemini_models():
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
        req = urllib.request.Request(
            url, data=payload, headers={'Content-Type': 'application/json'}, method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=per_model_timeout) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            detail = e.read().decode('utf-8', errors='replace')[:200]
            if e.code in (404, 429, 500, 502, 503, 504):
                # Model không sẵn sàng hoặc quá tải -> thử model kế tiếp
                errors.append(f'{model}: lỗi {e.code}')
                continue
            # Lỗi cấu hình key (400/401/403) -> dừng ngay
            raise RuntimeError(f'Gemini API lỗi {e.code}: {detail}')
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            errors.append(f'{model}: {type(e).__name__}')
            continue
    raise RuntimeError(
        'AI đang bận/quá tải, đã thử cả model dự phòng ('
        + '; '.join(errors) + '). Vui lòng thử lại sau ít phút.'
    )


def call_gemini(prompt, temperature=0.7):
    """Gọi Gemini API và trả về text kết quả."""
    payload = json.dumps({
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': temperature},
    }).encode('utf-8')
    data = _post_gemini(payload)
    try:
        return data['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError):
        raise RuntimeError('Gemini không trả về nội dung hợp lệ.')


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


def _call_gemini_json(prompt):
    """Gọi Gemini và yêu cầu kết quả JSON, trả về dict."""
    payload = json.dumps({
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'temperature': 0.4,
            'responseMimeType': 'application/json',
        },
    }).encode('utf-8')
    data = _post_gemini(payload)
    try:
        text = data['candidates'][0]['content']['parts'][0]['text']
        return json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError):
        raise RuntimeError('AI không trả về dữ liệu hợp lệ. Vui lòng thử lại.')


def generate_exam_feedback(student_exam):
    """Sinh phản hồi học tập cá nhân hoá sau khi học sinh nộp bài."""
    exam = student_exam.exam
    exam_questions = {eq.question_id: eq for eq in student_exam.exam_questions.all()}
    answers = {a.question_id: a for a in student_exam.answers.all()}

    wrong_items = []
    correct_items = 0
    blank_items = 0
    for eq in student_exam.exam_questions.all():
        ans = answers.get(eq.question_id)
        q = eq.question
        if ans and ans.selected_answer and not ans.is_correct:
            def _opt_text(letter):
                return {
                    'A': eq.display_option_a,
                    'B': eq.display_option_b,
                    'C': eq.display_option_c,
                    'D': eq.display_option_d,
                }.get(letter, '')
            wrong_items.append({
                'question': q.content[:250],
                'chosen': _opt_text(ans.selected_answer)[:150],
                'correct': _opt_text(eq.correct_display_option)[:150],
            })
        elif ans and ans.is_correct:
            correct_items += 1
        elif not ans or not ans.selected_answer:
            blank_items += 1

    score = student_exam.score or 0
    minutes = round((student_exam.time_spent or 0) / 60)

    data_block = {
        'ky_thi': exam.name,
        'diem': score,
        'so_cau_dung': correct_items,
        'so_cau_sai': len(wrong_items),
        'so_cau_bo_trong': blank_items,
        'thoi_lam_bai_phut': minutes,
        'cac_cau_sai': wrong_items[:20],
    }

    prompt = f"""Bạn là cố vấn học tập AI của một học sinh Việt Nam vừa làm bài thi trắc nghiệm online.
Dựa vào kết quả dưới đây, hãy viết phản hồi học tập CÁ NHÂN HOÁ, ấm áp, động viên nhưng trung thực về điểm yếu.

DỮ LIỆU BÀI THI:
{json.dumps(data_block, ensure_ascii=False, indent=1)}

Yêu cầu nội dung:
- Ngôn ngữ: tiếng Việt, xưng "em" khi nói với học sinh, giáo viên nhẹ nhàng
- Tìm MẪU trong các câu sai (cùng chủ điểm sai nhiều câu → kiến thức hổng; sai rải rác → cẩn thận/kỹ năng làm bài)
- Gợi ý ôn tập PHỤC VỤ LUYỆN TẬP THẾ, dựa trực tiếp trên nội dung câu hỏi bị sai

Trả về ĐÚNG JSON với schema:
{{
  "summary": "2-3 câu nhận xét tổng quan về bài làm và thái độ",
  "strengths": ["1-3 điểm mạnh cụ thể"],
  "weak_topics": [{{"topic": "tên chủ điểm yếu", "note": "giải thích vì sao sai, lỗi thường gặp"}}],
  "advice": ["3-5 gợi ý ôn tập cụ thể, kèm hành động ngay được"],
  "encouragement": "1 câu động viên gửi riêng cho em ấy"
}}
Các chuỗi viết bằng tiếng Việt tự nhiên."""

    return _call_gemini_json(prompt)
