from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


class Portfolio(models.Model):
    direction_option = (("Long", "Long"), ("Short", "Short"))
    portfolio_name = models.CharField(max_length=200)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True
    )

    direction = models.CharField(max_length=200, null=True, choices=direction_option)
    ticker = models.CharField(max_length=10, null=True)
    price = models.FloatField(null=True)
    date = models.DateField(null=True)

    def __str__(self):
        return self.portfolio_name
