from django.urls import path
from .views import (
    MyProfileView, SongListCreateView, SongDestroyView,
    PartnerListCreateView, SessionBulkSyncView,
)

urlpatterns = [
    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('songs/', SongListCreateView.as_view(), name='song-list'),
    path('songs/<int:pk>/', SongDestroyView.as_view(), name='song-delete'),
    path('partners/', PartnerListCreateView.as_view(), name='partner-list'),
    path('sessions/', SessionBulkSyncView.as_view(), name='session-sync'),
]
