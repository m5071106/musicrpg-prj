from django.urls import path
from .views import (
    MyProfileView,
    PublicProfileView,
    SongListCreateView,
    SongDestroyView,
    ComparePartnerListCreateView,
    ComparePartnerDestroyView,
    CompareSessionListCreateView,
    CompareSessionDestroyView,
)

urlpatterns = [
    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('profile/<str:username>/', PublicProfileView.as_view(), name='public-profile'),
    path('songs/', SongListCreateView.as_view(), name='song-list'),
    path('songs/<int:pk>/', SongDestroyView.as_view(), name='song-delete'),
    # パートナー管理（PWA/ブラウザ間データ共有）
    path('partners/', ComparePartnerListCreateView.as_view(), name='partner-list'),
    path('partners/<int:pk>/', ComparePartnerDestroyView.as_view(), name='partner-delete'),
    # セッション履歴管理（PWA/ブラウザ間データ共有）
    path('sessions/', CompareSessionListCreateView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', CompareSessionDestroyView.as_view(), name='session-delete'),
]
