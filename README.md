# Regression Playground

A small, hands-on machine-learning lab for seeing how simple linear regression fits data and exploring what happens when continuous predictions become decisions. The example uses study hours and exam marks, but you can upload your own two-column CSV or edit observations directly.

> **The threshold is not part of regression.** The model always predicts a continuous value. PASS/FAIL is a separate decision rule applied to that prediction, and changing it never refits the line or changes model-error metrics.

## Preview

### Regression Visualization

![Regression Visualization](screenshots/regression-visualization.png)

### Regression Metrics and Results

![Regression Metrics and Results](screenshots/regression-metrics.png)

## Features

- Fit a simple least-squares line with a readable NumPy implementation.
- Inspect actual observations, the fitted line, a prediction-based PASS/FAIL color, and the decision cutoff.
- Adjust the cutoff and see decision counts update instantly.
- Upload CSV data, add observations, or remove them to explore the effect of outliers.
- Review R², MSE, RMSE, MAE, sample count, and decision totals.
- Read concise explanations of the model and its metrics.

## Architecture

```text
backend/
├── main.py                    # FastAPI routes and CORS
├── models/regression.py       # Least-squares calculation and metrics
├── schemas/regression.py      # Request/response validation
├── services/regression_service.py
├── requirements.txt
└── tests/test_regression.py
frontend/
├── src/
│   ├── components/            # Chart, threshold, metrics, CSV, explanations
│   ├── services/api.js        # Backend request
│   ├── App.jsx                # Dataset and application state
│   └── styles.css
├── package.json
└── vite.config.js
```

The frontend owns the dataset and threshold. The backend owns regression fitting and returns continuous predictions with residuals. That boundary keeps decision strategies independent and makes it straightforward to compare another model later.

## Run locally

You need Python 3.10 or newer and Node.js 18 or newer. Start the backend and frontend in separate terminals.

### 1. Start the API

From the repository root, create and activate a virtual environment, then install the backend dependencies:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive API documentation is at `http://127.0.0.1:8000/docs`.

To run the backend tests, in another terminal:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q
```

### 2. Start the frontend

In a separate terminal from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Vite forwards `/api` requests to the local FastAPI server.

## API

### `POST /api/regression`

Request body:

```json
{
  "data": [
    { "x": 2, "y": 35 },
    { "x": 3, "y": 42 },
    { "x": 4, "y": 48 }
  ]
}
```

Each point must have finite numeric `x` and `y` values. At least two observations with distinct `x` values are required. Extra fields are rejected; invalid requests return a descriptive FastAPI `422` response.

Successful response:

```json
{
  "slope": 6.5,
  "intercept": 22.0,
  "r2": 0.997,
  "mse": 0.083,
  "rmse": 0.289,
  "mae": 0.167,
  "predictions": [
    { "x": 2.0, "actual": 35.0, "predicted": 35.0, "residual": 0.0 },
    { "x": 3.0, "actual": 42.0, "predicted": 41.5, "residual": 0.5 },
    { "x": 4.0, "actual": 48.0, "predicted": 48.0, "residual": 0.0 }
  ]
}
```

Values above are illustrative. The endpoint deliberately accepts and returns no threshold or decision labels. `GET /api/health` provides a small health check.

### CSV format

Upload a `.csv` with a header named `x,y` and at least two data rows. Values must be finite numbers, with at least two distinct `x` values. For example:

```csv
x,y
2,35
3,42
4,48
```

## How regression works

For observations $(x_i, y_i)$, the implementation computes the least-squares slope and intercept directly:

$$
b_1 = \frac{\sum_i (x_i - \bar{x})(y_i - \bar{y})}{\sum_i (x_i - \bar{x})^2}, \qquad b_0 = \bar{y} - b_1\bar{x}
$$

The prediction is $\hat{y}_i = b_0 + b_1x_i$, and the residual is $e_i = y_i - \hat{y}_i$. MSE is the mean of $e_i^2$; RMSE is its square root; MAE is the mean absolute residual. R² compares residual sum of squares with the total variation around the mean. NumPy is used for the arithmetic; scikit-learn is intentionally not needed.

The decision rule runs after fitting: predicted mark $\geq$ chosen threshold means PASS, otherwise FAIL. It can change the label counts, but not slope, intercept, predictions, or regression metrics.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and use the GitHub issue templates when proposing or reporting work. There is no need to claim an issue number that has not been created; describe your proposed change in a new issue or pull request.

## Future contribution ideas

These are suggestions for issues that maintainers could create. They are not existing GitHub issues.

### Good First Issue

1. Add a small library of built-in datasets with a dataset selector.
2. Add a downloadable CSV export for the current observations and predictions.
3. Improve keyboard and screen-reader support for the chart and data controls.
4. Add frontend tests for CSV parsing, including malformed and edge-case files.

### Medium

5. Visualize residuals as stems or a separate residual plot.
6. Add a polynomial regression option with a degree control.
7. Add a confusion matrix and precision/recall for the selected threshold, with clear notes about deriving labels from a regression target.
8. Add API tests for constant targets, large datasets, and numerical edge cases.

### Advanced

9. Implement gradient descent from scratch and let learners compare it with the closed-form fit.
10. Add multiple linear regression with a clear feature-selection interface.
11. Add k-fold cross-validation and display fold-level metrics.
12. Add uncertainty intervals for predictions and explain their assumptions.

## License

This project is available under the MIT License. See [LICENSE](LICENSE).
