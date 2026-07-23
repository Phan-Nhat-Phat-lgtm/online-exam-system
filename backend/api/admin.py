from django.contrib import admin
from .models import Student, QuestionBank, Question, Exam, StudentExam, StudentAnswer, Result

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'full_name', 'class_name', 'email', 'is_active', 'created_at')
    search_fields = ('student_id', 'full_name', 'class_name')
    list_filter = ('is_active', 'class_name')

@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('content', 'bank', 'correct_answer', 'created_at')
    list_filter = ('bank',)
    search_fields = ('content',)

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('name', 'total_questions', 'duration_minutes', 'start_time', 'end_time', 'is_active')
    list_filter = ('is_active',)

@admin.register(StudentExam)
class StudentExamAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'status', 'score', 'started_at', 'submitted_at')
    list_filter = ('status', 'exam')

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('student_exam', 'score', 'correct_count', 'total_questions', 'submitted_at')
