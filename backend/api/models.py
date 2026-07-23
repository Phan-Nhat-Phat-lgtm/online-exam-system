from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=50, unique=True, verbose_name="MSSV")
    full_name = models.CharField(max_length=255, verbose_name="Họ tên")
    class_name = models.CharField(max_length=100, verbose_name="Lớp")
    email = models.EmailField(blank=True, null=True, verbose_name="Email")
    is_active = models.BooleanField(default=True, verbose_name="Trạng thái kích hoạt")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"


class QuestionBank(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên ngân hàng câu hỏi")
    description = models.TextField(blank=True, verbose_name="Mô tả")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Question(models.Model):
    CORRECT_ANSWER_CHOICES = [
        ('A', 'Đáp án A'),
        ('B', 'Đáp án B'),
        ('C', 'Đáp án C'),
        ('D', 'Đáp án D'),
    ]

    bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name='questions')
    content = models.TextField(verbose_name="Nội dung câu hỏi")
    option_a = models.TextField(verbose_name="Đáp án A")
    option_b = models.TextField(verbose_name="Đáp án B")
    option_c = models.TextField(verbose_name="Đáp án C")
    option_d = models.TextField(verbose_name="Đáp án D")
    correct_answer = models.CharField(max_length=1, choices=CORRECT_ANSWER_CHOICES, verbose_name="Đáp án đúng")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"[{self.bank.name}] {self.content[:60]}..."


class Exam(models.Model):
    name = models.CharField(max_length=255, verbose_name="Tên kỳ thi")
    question_banks = models.ManyToManyField(QuestionBank, related_name='exams', verbose_name="Ngân hàng câu hỏi sử dụng")
    total_questions = models.PositiveIntegerField(default=50, verbose_name="Số lượng câu hỏi")
    duration_minutes = models.PositiveIntegerField(default=60, verbose_name="Thời gian làm bài (phút)")
    start_time = models.DateTimeField(verbose_name="Thời gian bắt đầu")
    end_time = models.DateTimeField(verbose_name="Thời gian kết thúc")
    is_active = models.BooleanField(default=True, verbose_name="Kích hoạt")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def status_text(self):
        now = timezone.now()
        if now < self.start_time:
            return "Chưa đến thời gian làm bài"
        elif now > self.end_time:
            return "Đã kết thúc kỳ thi"
        return "Đang diễn ra"


class StudentExam(models.Model):
    STATUS_CHOICES = [
        ('NOT_STARTED', 'Chưa bắt đầu'),
        ('IN_PROGRESS', 'Đang làm bài'),
        ('SUBMITTED', 'Đã nộp bài'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_exams')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='student_exams')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    correct_count = models.IntegerField(default=0)
    incorrect_count = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    time_spent = models.IntegerField(default=0, help_text="Thời gian làm bài tính bằng giây")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'exam']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} - {self.exam.name}"


class StudentExamQuestion(models.Model):
    student_exam = models.ForeignKey(StudentExam, on_delete=models.CASCADE, related_name='exam_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order = models.IntegerField()
    
    # Store per-student shuffled options
    display_option_a = models.TextField()
    display_option_b = models.TextField()
    display_option_c = models.TextField()
    display_option_d = models.TextField()
    correct_display_option = models.CharField(max_length=1) # 'A', 'B', 'C', or 'D'

    class Meta:
        ordering = ['order']
        unique_together = ['student_exam', 'question']


class StudentAnswer(models.Model):
    student_exam = models.ForeignKey(StudentExam, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer = models.CharField(max_length=1, null=True, blank=True) # A, B, C, D
    is_correct = models.BooleanField(null=True, blank=True)
    is_flagged = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student_exam', 'question']


class Result(models.Model):
    student_exam = models.OneToOneField(StudentExam, on_delete=models.CASCADE, related_name='result')
    score = models.FloatField()
    correct_count = models.IntegerField()
    incorrect_count = models.IntegerField()
    total_questions = models.IntegerField()
    time_spent = models.IntegerField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student_exam.student.full_name} - {self.score} điểm"
