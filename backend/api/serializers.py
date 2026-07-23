from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Student, QuestionBank, Question, Exam,
    StudentExam, StudentExamQuestion, StudentAnswer, Result
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser']

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'full_name', 'class_name', 'email',
            'is_active', 'user', 'username', 'password', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        username = validated_data.pop('username', validated_data.get('student_id'))
        password = validated_data.pop('password', '123456')
        email = validated_data.get('email', '')

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=validated_data.get('full_name', '')
        )
        student = Student.objects.create(user=user, **validated_data)
        return student

    def update(self, instance, validated_data):
        if 'username' in validated_data:
            username = validated_data.pop('username')
            instance.user.username = username
            instance.user.save()
        if 'password' in validated_data and validated_data['password']:
            instance.user.set_password(validated_data['password'])
            instance.user.save()
            validated_data.pop('password')
        return super().update(instance, validated_data)


class QuestionBankSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = QuestionBank
        fields = ['id', 'name', 'description', 'question_count', 'created_by_name', 'created_at']


class QuestionSerializer(serializers.ModelSerializer):
    bank_name = serializers.CharField(source='bank.name', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'bank', 'bank_name', 'content',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'created_at'
        ]


class ExamSerializer(serializers.ModelSerializer):
    question_banks_info = QuestionBankSerializer(source='question_banks', many=True, read_only=True)
    question_bank_ids = serializers.PrimaryKeyRelatedField(
        queryset=QuestionBank.objects.all(),
        many=True,
        write_only=True,
        source='question_banks'
    )
    status_text = serializers.ReadOnlyField()

    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'question_banks_info', 'question_bank_ids',
            'total_questions', 'duration_minutes', 'start_time',
            'end_time', 'is_active', 'status_text', 'created_at'
        ]


class StudentExamQuestionSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='question.id', read_only=True)
    content = serializers.CharField(source='question.content', read_only=True)

    class Meta:
        model = StudentExamQuestion
        fields = [
            'order', 'question_id', 'content',
            'display_option_a', 'display_option_b',
            'display_option_c', 'display_option_d'
        ]


class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = ['question', 'selected_answer', 'is_flagged', 'updated_at']


class StudentExamSerializer(serializers.ModelSerializer):
    exam_info = ExamSerializer(source='exam', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    class_name = serializers.CharField(source='student.class_name', read_only=True)
    exam_questions = StudentExamQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = StudentExam
        fields = [
            'id', 'student', 'student_id', 'student_name', 'class_name',
            'exam', 'exam_info', 'status', 'started_at', 'submitted_at',
            'score', 'correct_count', 'incorrect_count', 'total_questions',
            'time_spent', 'exam_questions', 'created_at'
        ]


class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_exam.student.full_name', read_only=True)
    student_id = serializers.CharField(source='student_exam.student.student_id', read_only=True)
    class_name = serializers.CharField(source='student_exam.student.class_name', read_only=True)
    exam_name = serializers.CharField(source='student_exam.exam.name', read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'student_exam', 'student_name', 'student_id', 'class_name',
            'exam_name', 'score', 'correct_count', 'incorrect_count',
            'total_questions', 'time_spent', 'submitted_at'
        ]
