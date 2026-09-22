"""Locust load tests for MedMath Solver API.

Run with backend running on :8000:
    locust -f locustfile.py --host=http://127.0.0.1:8000
"""

from locust import HttpUser, between, task


class MedMathUser(HttpUser):
    wait_time = between(0.5, 2.0)

    def on_start(self):
        resp = self.client.get("/api/cases")
        if resp.status_code == 200:
            cases = resp.json()
            self.case_id = cases[0]["id"] if cases else None
        else:
            self.case_id = None

    @task(5)
    def health(self):
        self.client.get("/api/health")

    @task(4)
    def list_cases(self):
        self.client.get("/api/cases")

    @task(3)
    def calculate_seeded(self):
        if self.case_id:
            self.client.post("/api/calculate", json={"case_id": self.case_id})

    @task(3)
    def calculate_custom(self):
        self.client.post(
            "/api/calculate/custom",
            json={"matrix": [[2.0, 1.0], [1.0, -1.0]], "vector": [3.0, 0.0]},
        )

    @task(2)
    def get_history(self):
        self.client.get("/api/history", params={"limit": 10})

    @task(1)
    def metrics(self):
        self.client.get("/metrics")
