# Study Platform Backend Dockerfile (DEVELOPMENT_PLAN §3.10.3)
ARG PYTHON_VERSION=3.13
FROM python:${PYTHON_VERSION}-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
RUN useradd --create-home --uid 1000 app

FROM base AS development
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/dev.txt
COPY . .
RUN chown -R app:app /app
USER app
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

FROM base AS production
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/prod.txt
COPY . .
# Estáticos do admin, servidos pelo WhiteNoise. Os valores abaixo valem só neste passo.
RUN DJANGO_SECRET_KEY=build-only DJANGO_ALLOWED_HOSTS=build.invalid     DATABASE_URL=postgresql://build:build@localhost:5432/build     DJANGO_SETTINGS_MODULE=config.settings.production     python manage.py collectstatic --noinput
RUN chown -R app:app /app
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/healthz')"
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
