from django.urls import path
from .views import MyProfileView, SongListCreateView, SongDestroyView

urlpatterns = [
    path('profile/', MyProfileView.as_view(), name='my-profile'),
    path('songs/', SongListCreateView.as_view(), name='song-list'),
    path('songs/<int:pk>/', SongDestroyView.as_view(), name='song-delete'),
]
