from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    StudentViewSet, QuestionBankViewSet, QuestionViewSet,
    ExamViewSet, StudentExamViewSet, ResultViewSet,
    DashboardView, UserProfileView
)

router = DefaultRouter()
router.register('students', StudentViewSet)
router.register('banks', QuestionBankViewSet)
router.register('questions', QuestionViewSet)
router.register('exams', ExamViewSet)
router.register('student-exams', StudentExamViewSet)
router.register('results', ResultViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
