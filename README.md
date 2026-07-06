# AutoML Studio

AutoML Studio is a powerful platform for uploading datasets, running parallel model training across multiple algorithms, and evaluating machine learning models instantly.

## Architecture

This project is divided into two main components:
1. **Frontend**: A modern web interface built with Next.js, React, and Tailwind CSS.
2. **Backend**: A robust API and ML engine built with Django, Django REST Framework, and Python.

## Features
- **Dataset Upload & Processing**: Seamlessly upload CSV datasets and handle missing values or categorical data.
- **Parallel ML Training**: Train multiple machine learning models (e.g., XGBoost, Random Forest, LightGBM) concurrently.
- **Model Evaluation**: View detailed performance metrics and explanations for the trained models.
- **Interactive Dashboard**: A beautiful, dark-mode focused UI that provides a great user experience.

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Python](https://www.python.org/) (v3.10 or higher recommended)
- [Git](https://git-scm.com/)

---

## Project Setup & Cloning Guide

To get a local copy up and running, follow these simple steps.

### 1. Clone the Repository
Open your terminal and run the following command to clone the repository:
```bash
git clone https://github.com/punit1703/AutoML-Studio.git
cd AutoML-Studio
```

### 2. Backend Setup
We recommend using a Python virtual environment to manage dependencies.

```bash
# 1. Create a virtual environment in the project root
python -m venv venv

# 2. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# 3. Install the required Python packages
pip install -r requirements.txt

# 4. Navigate into the backend directory
cd backend

# 5. Run database migrations
python manage.py migrate

# 6. Start the Django development server
python manage.py runserver
```
The backend API should now be running at `http://localhost:8000/`.

### 3. Frontend Setup
Open a **new terminal window** or tab (keep the backend server running), and execute the following:

```bash
# 1. Navigate to the frontend directory from the project root
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```
The frontend application should now be accessible in your browser at `http://localhost:3000/`.

---

## Contributing
Contributions, issues, and feature requests are welcome. Feel free to check the issues page if you want to contribute.

## License
[MIT License](https://choosealicense.com/licenses/mit/)
