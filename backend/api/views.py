import random
import io
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db.models import Avg, Max, Min, Count, Q
from django.utils import timezone
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import openpyxl

from .models import (
    Student, QuestionBank, Question, Exam,
    StudentExam, StudentExamQuestion, StudentAnswer, Result
)
from .serializers import (
    StudentSerializer, QuestionBankSerializer, QuestionSerializer,
    ExamSerializer, StudentExamSerializer, StudentExamQuestionSerializer,
    StudentAnswerSerializer, ResultSerializer, UserSerializer
)
from .permissions import IsAdminUser, IsStudentUser
from .importer import import_questions_from_file


class UserProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        student = getattr(user, 'student_profile', None)
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_staff or user.is_superuser,
            'student_info': StudentSerializer(student).data if student else None
        }
        return Response(data)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['student_id', 'full_name', 'class_name', 'email', 'user__username']
    ordering_fields = ['student_id', 'full_name', 'created_at']

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        student = self.get_object()
        new_password = request.data.get('new_password', '123456')
        student.user.set_password(new_password)
        student.user.save()
        return Response({'message': f'Đã đặt lại mật khẩu cho sinh viên {student.full_name} thành {new_password}'})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        student = self.get_object()
        student.is_active = not student.is_active
        student.user.is_active = student.is_active
        student.user.save()
        student.save()
        status_str = "kích hoạt" if student.is_active else "khóa"
        return Response({'message': f'Đã {status_str} tài khoản của sinh viên {student.full_name}', 'is_active': student.is_active})


class QuestionBankViewSet(viewsets.ModelViewSet):
    queryset = QuestionBank.objects.all()
    serializer_class = QuestionBankSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['bank']
    search_fields = ['content', 'option_a', 'option_b', 'option_c', 'option_d']

    @action(detail=False, methods=['post'])
    def import_questions(self, request):
        file_obj = request.FILES.get('file')
        bank_id = request.data.get('bank_id')

        if not file_obj:
            return Response({'error': 'Vui lòng chọn file để import'}, status=status.HTTP_400_BAD_REQUEST)
        if not bank_id:
            return Response({'error': 'Vui lòng chọn Ngân hàng câu hỏi'}, status=status.HTTP_400_BAD_REQUEST)

        result = import_questions_from_file(file_obj, file_obj.name, bank_id)
        if not result['success']:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(result, status=status.HTTP_200_OK)


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['start_time', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def student_exams_list(self, request):
        """Available exams for students"""
        student = getattr(request.user, 'student_profile', None)
        if not student:
            return Response({'error': 'Người dùng không phải là học sinh'}, status=status.HTTP_403_FORBIDDEN)

        exams = Exam.objects.filter(is_active=True).order_by('-start_time')
        data = []
        for exam in exams:
            st_exam = StudentExam.objects.filter(student=student, exam=exam).first()
            data.append({
                'id': exam.id,
                'name': exam.name,
                'total_questions': exam.total_questions,
                'duration_minutes': exam.duration_minutes,
                'start_time': exam.start_time,
                'end_time': exam.end_time,
                'status_text': exam.status_text,
                'student_exam_status': st_exam.status if st_exam else 'NOT_STARTED',
                'student_exam_id': st_exam.id if st_exam else None,
                'score': st_exam.score if st_exam else None,
            })
        return Response(data)


class StudentExamViewSet(viewsets.ModelViewSet):
    queryset = StudentExam.objects.all()
    serializer_class = StudentExamSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def start_exam(self, request):
        exam_id = request.data.get('exam_id')
        student = getattr(request.user, 'student_profile', None)

        if not student:
            return Response({'error': 'Bạn không có quyền làm bài thi này'}, status=status.HTTP_403_FORBIDDEN)

        try:
            exam = Exam.objects.get(id=exam_id, is_active=True)
        except Exam.DoesNotExist:
            return Response({'error': 'Kỳ thi không tồn tại hoặc đã bị khóa'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        if now < exam.start_time:
            return Response({'error': 'Chưa đến thời gian làm bài.'}, status=status.HTTP_400_BAD_REQUEST)
        if now > exam.end_time:
            return Response({'error': 'Đã kết thúc kỳ thi.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if StudentExam already exists
        student_exam, created = StudentExam.objects.get_or_create(
            student=student,
            exam=exam,
            defaults={'total_questions': exam.total_questions}
        )

        if student_exam.status == 'SUBMITTED':
            return Response({'error': 'Bạn đã nộp bài thi này rồi.'}, status=status.HTTP_400_BAD_REQUEST)

        if created or student_exam.status == 'NOT_STARTED':
            # Generate random questions from selected question banks
            banks = exam.question_banks.all()
            all_questions = list(Question.objects.filter(bank__in=banks))

            if not all_questions:
                student_exam.delete()
                return Response({'error': 'Ngân hàng câu hỏi được chọn hiện chưa có câu hỏi nào'}, status=status.HTTP_400_BAD_REQUEST)

            count = min(exam.total_questions, len(all_questions))
            selected_questions = random.sample(all_questions, count)

            # Create shuffled questions for this student
            for idx, q in enumerate(selected_questions, start=1):
                options = [
                    ('A', q.option_a),
                    ('B', q.option_b),
                    ('C', q.option_c),
                    ('D', q.option_d),
                ]
                random.shuffle(options)
                
                # Find which new display letter matches original correct answer
                correct_letter = None
                display_letters = ['A', 'B', 'C', 'D']
                display_map = {}
                for letter_idx, (orig_letter, text) in enumerate(options):
                    dis_letter = display_letters[letter_idx]
                    display_map[dis_letter] = text
                    if orig_letter == q.correct_answer:
                        correct_letter = dis_letter

                StudentExamQuestion.objects.create(
                    student_exam=student_exam,
                    question=q,
                    order=idx,
                    display_option_a=display_map['A'],
                    display_option_b=display_map['B'],
                    display_option_c=display_map['C'],
                    display_option_d=display_map['D'],
                    correct_display_option=correct_letter
                )

            student_exam.status = 'IN_PROGRESS'
            student_exam.started_at = now
            student_exam.total_questions = count
            student_exam.save()

        # Fetch existing saved answers
        answers_dict = {}
        for ans in StudentAnswer.objects.filter(student_exam=student_exam):
            answers_dict[ans.question_id] = {
                'selected_answer': ans.selected_answer,
                'is_flagged': ans.is_flagged
            }

        serializer = StudentExamSerializer(student_exam)
        response_data = serializer.data
        response_data['saved_answers'] = answers_dict

        return Response(response_data)

    @action(detail=True, methods=['post'])
    def save_answer(self, request, pk=None):
        student_exam = self.get_object()
        if student_exam.status == 'SUBMITTED':
            return Response({'error': 'Bài thi đã được nộp'}, status=status.HTTP_400_BAD_REQUEST)

        question_id = request.data.get('question_id')
        selected_answer = request.data.get('selected_answer')
        is_flagged = request.data.get('is_flagged', False)
        time_spent = request.data.get('time_spent', 0)

        if time_spent:
            student_exam.time_spent = time_spent
            student_exam.save()

        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Câu hỏi không tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

        answer_obj, _ = StudentAnswer.objects.get_or_create(
            student_exam=student_exam,
            question=question
        )
        answer_obj.selected_answer = selected_answer
        answer_obj.is_flagged = is_flagged
        answer_obj.save()

        return Response({'status': 'saved'})

    @action(detail=True, methods=['post'])
    def submit_exam(self, request, pk=None):
        student_exam = self.get_object()
        if student_exam.status == 'SUBMITTED':
            return Response({'error': 'Bài thi này đã được nộp trước đó'}, status=status.HTTP_400_BAD_REQUEST)

        answers_data = request.data.get('answers', {})
        time_spent = request.data.get('time_spent', student_exam.time_spent)

        exam_questions = StudentExamQuestion.objects.filter(student_exam=student_exam)
        correct_count = 0
        incorrect_count = 0

        for eq in exam_questions:
            q_id = str(eq.question.id)
            user_choice = answers_data.get(q_id) or answers_data.get(eq.question.id)
            
            is_correct = (user_choice == eq.correct_display_option) if user_choice else False
            if is_correct:
                correct_count += 1
            else:
                incorrect_count += 1

            ans_obj, _ = StudentAnswer.objects.get_or_create(
                student_exam=student_exam,
                question=eq.question
            )
            ans_obj.selected_answer = user_choice
            ans_obj.is_correct = is_correct
            ans_obj.save()

        total = student_exam.total_questions or len(exam_questions)
        score = round((correct_count / total * 10.0), 2) if total > 0 else 0.0

        student_exam.status = 'SUBMITTED'
        student_exam.submitted_at = timezone.now()
        student_exam.score = score
        student_exam.correct_count = correct_count
        student_exam.incorrect_count = incorrect_count
        student_exam.time_spent = time_spent
        student_exam.save()

        # Save Result object
        Result.objects.update_or_create(
            student_exam=student_exam,
            defaults={
                'score': score,
                'correct_count': correct_count,
                'incorrect_count': incorrect_count,
                'total_questions': total,
                'time_spent': time_spent
            }
        )

        return Response({
            'score': score,
            'correct_count': correct_count,
            'incorrect_count': incorrect_count,
            'total_questions': total,
            'time_spent': time_spent
        })


class ResultViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student_exam__exam']
    search_fields = ['student_exam__student__full_name', 'student_exam__student__student_id', 'student_exam__student__class_name']
    ordering_fields = ['score', 'submitted_at']

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminUser])
    def export_excel(self, request):
        exam_id = request.query_params.get('exam_id')
        queryset = self.get_queryset()
        if exam_id:
            queryset = queryset.filter(student_exam__exam_id=exam_id)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "KẾT QUẢ THI"

        headers = ['STT', 'MSSV', 'Họ và tên', 'Lớp', 'Tên kỳ thi', 'Điểm', 'Số câu đúng', 'Số câu sai', 'Tổng số câu', 'Thời gian làm (giây)', 'Ngày nộp']
        ws.append(headers)

        for idx, res in enumerate(queryset, start=1):
            st = res.student_exam.student
            ws.append([
                idx,
                st.student_id,
                st.full_name,
                st.class_name,
                res.student_exam.exam.name,
                res.score,
                res.correct_count,
                res.incorrect_count,
                res.total_questions,
                res.time_spent,
                res.submitted_at.strftime('%H:%M:%S %d/%m/%Y')
            ])

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="Ket_Qua_Thi.xlsx"'
        return response


class DashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_students = Student.objects.filter(is_active=True).count()
        total_banks = QuestionBank.objects.count()
        total_exams = Exam.objects.count()
        total_exams_taken = StudentExam.objects.filter(status='SUBMITTED').count()

        results = Result.objects.all()
        avg_score = results.aggregate(Avg('score'))['score__avg'] or 0
        max_score = results.aggregate(Max('score'))['score__max'] or 0
        min_score = results.aggregate(Min('score'))['score__min'] or 0

        recent_results = Result.objects.select_related('student_exam__student', 'student_exam__exam')[:10]
        recent_data = ResultSerializer(recent_results, many=True).data

        top_students = Result.objects.select_related('student_exam__student').order_by('-score')[:5]
        top_data = ResultSerializer(top_students, many=True).data

        return Response({
            'total_students': total_students,
            'total_banks': total_banks,
            'total_exams': total_exams,
            'total_exams_taken': total_exams_taken,
            'avg_score': round(avg_score, 2),
            'max_score': round(max_score, 2),
            'min_score': round(min_score, 2),
            'recent_exams': recent_data,
            'top_students': top_data,
        })
