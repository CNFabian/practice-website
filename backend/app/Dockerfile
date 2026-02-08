# Use a base Python image
FROM python:3.10-slim

# Install postgresql-client for pg_isready and other system packages
RUN apt-get update \
    && apt-get install -y postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your app code
COPY . .

# Make migrate script executable
RUN chmod +x migrate.sh

# Add the directory where pip installs executables to the PATH
ENV PATH="/usr/local/bin:$PATH"

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Define the command to run the app (no --reload in production)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]