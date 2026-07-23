import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exam_system.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Student, QuestionBank, Question, Exam

def seed_data():
    print("Initializing Database Seeder...")
    
    # 1. Superuser
    if not User.objects.filter(username='admin').exists():
        admin = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Created Superuser: admin / admin123")
    else:
        admin = User.objects.get(username='admin')
        admin.set_password('admin123')
        admin.save()
        print("Updated Superuser password for admin")

    # 2. Sample Question Banks
    bank1, _ = QuestionBank.objects.get_or_create(
        name="Ứng dụng CNTT cơ bản",
        defaults={"description": "Ngân hàng câu hỏi chuẩn kiến thức CNTT cơ bản cho sinh viên", "created_by": admin}
    )
    bank2, _ = QuestionBank.objects.get_or_create(
        name="MOS (Microsoft Office Specialist)",
        defaults={"description": "Câu hỏi thực hành Word, Excel, PowerPoint", "created_by": admin}
    )
    bank3, _ = QuestionBank.objects.get_or_create(
        name="IC3 (Internet and Computing Core Certification)",
        defaults={"description": "Chứng chỉ tin học quốc tế IC3 GS5/GS6", "created_by": admin}
    )

    # 3. Sample Questions for Bank 1
    sample_questions = [
        {
            "bank": bank1,
            "content": "Hệ điều hành Windows là loại phần mềm nào sau đây?",
            "option_a": "Phần mềm ứng dụng",
            "option_b": "Hệ điều hành / Phần mềm hệ thống",
            "option_c": "Phần mềm dịch",
            "option_d": "Phần mềm cơ sở dữ liệu",
            "correct_answer": "B"
        },
        {
            "bank": bank1,
            "content": "Phím tắt nào dùng để sao chép (Copy) đối tượng được chọn trong hệ điều hành Windows?",
            "option_a": "Ctrl + X",
            "option_b": "Ctrl + V",
            "option_c": "Ctrl + C",
            "option_d": "Ctrl + Z",
            "correct_answer": "C"
        },
        {
            "bank": bank1,
            "content": "Đơn vị nhỏ nhất dùng để đo lượng thông tin trong máy tính là gì?",
            "option_a": "Byte",
            "option_b": "Bit",
            "option_c": "Kilobyte",
            "option_d": "Megabyte",
            "correct_answer": "B"
        },
        {
            "bank": bank1,
            "content": "Trong Microsoft Word, phím tắt nào dùng để căn giữa đoạn văn bản?",
            "option_a": "Ctrl + L",
            "option_b": "Ctrl + R",
            "option_c": "Ctrl + E",
            "option_d": "Ctrl + J",
            "correct_answer": "C"
        },
        {
            "bank": bank1,
            "content": "Trong Microsoft Excel, hàm nào dùng để tính tổng các ô dữ liệu số?",
            "option_a": "AVERAGE()",
            "option_b": "COUNT()",
            "option_c": "SUM()",
            "option_d": "MAX()",
            "correct_answer": "C"
        },
    ]

    for q_data in sample_questions:
        Question.objects.get_or_create(
            bank=q_data["bank"],
            content=q_data["content"],
            defaults=q_data
        )

    # 4. Sample Students
    sample_students = [
        {"student_id": "SV001", "full_name": "Nguyễn Văn An", "class_name": "CNTT01", "username": "sv001", "password": "123"},
        {"student_id": "SV002", "full_name": "Trần Thị Bình", "class_name": "CNTT01", "username": "sv002", "password": "123"},
        {"student_id": "SV003", "full_name": "Lê Hoàng Cường", "class_name": "QTKD02", "username": "sv003", "password": "123"},
    ]

    for st in sample_students:
        user, _ = User.objects.get_or_create(username=st["username"], defaults={"first_name": st["full_name"]})
        user.set_password(st["password"])
        user.save()
        
        Student.objects.get_or_create(
            student_id=st["student_id"],
            defaults={
                "user": user,
                "full_name": st["full_name"],
                "class_name": st["class_name"],
                "email": f"{st['username']}@student.edu.vn",
                "is_active": True
            }
        )

    # 5. Sample Exam
    now = timezone.now()
    exam, created = Exam.objects.get_or_create(
        name="Thi Giữa Kỳ - Ứng dụng CNTT Cơ bản 2026",
        defaults={
            "total_questions": 5,
            "duration_minutes": 15,
            "start_time": now - timedelta(hours=1),
            "end_time": now + timedelta(days=30),
            "is_active": True,
            "created_by": admin
        }
    )
    if created:
        exam.question_banks.add(bank1, bank2, bank3)

    print("Data seeding completed successfully!")

if __name__ == '__main__':
    seed_data()
