from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .i18n import t
from .security import validate_case_name

Matrix6x6 = Annotated[list[list[float]], Field(min_length=1, max_length=6)]
Vector6 = Annotated[list[float], Field(min_length=1, max_length=6)]


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


def validate_system(matrix: list[list[float]], vector: list[float]) -> None:
    n = len(matrix)
    if any(len(row) != n for row in matrix):
        raise ValueError("Matriz debe ser cuadrada (n x n)")
    if len(vector) != n:
        raise ValueError(f"Vector debe tener longitud {n} (igual que filas de matriz)")
    for row in matrix:
        for val in row:
            if not (-1e6 <= val <= 1e6):
                raise ValueError("Valores fuera de rango [-1e6, 1e6]")
    for val in vector:
        if not (-1e6 <= val <= 1e6):
            raise ValueError("Valores fuera de rango [-1e6, 1e6]")


class MatrixInput(APIModel):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
        json_schema_extra={
            "examples": [
                {
                    "matrix": [[1.0, 1.0], [0.50, 0.05]],
                    "vector": [500.0, 50.0],
                }
            ]
        },
    )
    matrix: Matrix6x6
    vector: Vector6

    @model_validator(mode="after")
    def validate_dimensions(self) -> "MatrixInput":
        validate_system(self.matrix, self.vector)
        return self


class CaseCalculateRequest(APIModel):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
        json_schema_extra={"examples": [{"case_id": 1}]},
    )
    case_id: int


class CaseBase(APIModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=2000)
    reference_source: str = Field(min_length=1, max_length=200)
    reference_url: str | None = Field(default=None, max_length=500)
    matrix: Matrix6x6
    vector: Vector6
    expected: Annotated[list[float], Field(min_length=1, max_length=6)]
    variables: Annotated[list[str], Field(min_length=1, max_length=6)]
    units: Annotated[list[str], Field(min_length=1, max_length=6)]
    clinical_notes: str | None = Field(default=None, max_length=5000)
    is_active: bool = True

    @model_validator(mode="after")
    def validate_case(self) -> "CaseBase":
        if not validate_case_name(self.name):
            raise ValueError(t("invalid_case_name"))
        validate_system(self.matrix, self.vector)
        n = len(self.matrix)
        if len(self.expected) != n:
            raise ValueError(f"expected debe tener longitud {n}")
        if len(self.variables) != n:
            raise ValueError(f"variables debe tener longitud {n}")
        if len(self.units) != n:
            raise ValueError(f"units debe tener longitud {n}")
        for val in self.expected:
            if not (-1e6 <= val <= 1e6):
                raise ValueError("Valores fuera de rango [-1e6, 1e6]")
        return self


class CaseCreate(CaseBase):
    pass


class CaseUpdate(APIModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    reference_source: str | None = Field(default=None, min_length=1, max_length=200)
    reference_url: str | None = Field(default=None, max_length=500)
    matrix: Matrix6x6 | None = None
    vector: Vector6 | None = None
    expected: Annotated[list[float], Field(min_length=1, max_length=6)] | None = None
    variables: Annotated[list[str], Field(min_length=1, max_length=6)] | None = None
    units: Annotated[list[str], Field(min_length=1, max_length=6)] | None = None
    clinical_notes: str | None = Field(default=None, max_length=5000)
    is_active: bool | None = None


class CaseResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    name: str
    description: str
    reference_source: str
    reference_url: str | None
    matrix: list[list[float]]
    vector: list[float]
    expected: list[float]
    variables: list[str]
    units: list[str]
    clinical_notes: str | None


class CalculationResult(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "solution": [55.555556, 444.444444],
                    "verified": True,
                    "error_margin": 0.0,
                    "matches_expected": True,
                    "expected_diff": 0.0,
                    "success": True,
                    "message": "Resuelto correctamente",
                    "steps": [],
                }
            ]
        },
    )
    solution: list[float] | None
    steps: list[dict]
    verified: bool
    error_margin: float | None
    matches_expected: bool | None
    expected_diff: float | None
    success: bool
    message: str


class HistoryEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    case_id: int | None
    input_matrix: list[list[float]]
    input_vector: list[float]
    solution: list[float] | None
    verified: bool
    error_margin: float | None
    matches_expected: bool | None
    created_at: str


class HistoryStepsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    history_id: int
    case_id: int | None
    steps: list[dict]


class HistoryDeleteResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    deleted: int
