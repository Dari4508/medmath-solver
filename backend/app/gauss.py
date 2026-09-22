from dataclasses import asdict, dataclass


@dataclass
class GaussStep:
    step: int
    action: str
    matrix: list[list[float]]
    pivot_row: int | None = None
    target_row: int | None = None
    multiplier: float | None = None
    variable: int | None = None
    value: float | None = None
    description: str = ""

    def to_dict(self):
        return asdict(self)


@dataclass
class GaussResult:
    solution: list[float] | None
    steps: list[GaussStep]
    determinant: float | None
    rank: int
    success: bool
    message: str


def gaussian_elimination(
    matrix: list[list[float]],
    vector: list[float],
    track_steps: bool = True,
    tol: float = 1e-12,
) -> GaussResult:
    n = len(matrix)
    aug = [[*row[:], vector[i]] for i, row in enumerate(matrix)]
    steps = []
    step_num = 0
    swaps = 0
    pivot_cols: list[int] = []
    r = 0

    if track_steps:
        steps.append(
            GaussStep(
                step=step_num,
                action="start",
                matrix=[row[:] for row in aug],
                description="Matriz aumentada inicial [A|b]",
            )
        )
        step_num += 1

    for col in range(n):
        pivot_row = max(range(r, n), key=lambda row: abs(aug[row][col]))
        if abs(aug[pivot_row][col]) < tol:
            continue

        if pivot_row != r:
            aug[r], aug[pivot_row] = aug[pivot_row], aug[r]
            swaps += 1
            if track_steps:
                steps.append(
                    GaussStep(
                        step=step_num,
                        action="pivot",
                        matrix=[row[:] for row in aug],
                        pivot_row=r,
                        description=f"Intercambio fila {r} ↔ {pivot_row} (pivoteo parcial)",
                    )
                )
                step_num += 1

        pivot_cols.append(col)

        for row in range(r + 1, n):
            factor = aug[row][col] / aug[r][col]
            if abs(factor) < tol:
                continue
            for c in range(col, n + 1):
                aug[row][c] -= factor * aug[r][c]
            if track_steps:
                steps.append(
                    GaussStep(
                        step=step_num,
                        action="eliminate",
                        matrix=[row[:] for row in aug],
                        pivot_row=r,
                        target_row=row,
                        multiplier=factor,
                        description=f"F{row} ← F{row} - ({factor:.4f})×F{r}",  # noqa: RUF001
                    )
                )
                step_num += 1

        r += 1

    rank = r
    for i in range(rank, n):
        if abs(aug[i][n]) > tol:
            return GaussResult(
                solution=None,
                steps=steps,
                determinant=0.0,
                rank=rank,
                success=False,
                message="Sistema incompatible (sin solución)",
            )

    x = [0.0] * n
    for i in range(rank - 1, -1, -1):
        pivot_col = pivot_cols[i]
        sum_ax = sum(aug[i][j] * x[j] for j in range(pivot_col + 1, n))
        x[pivot_col] = (aug[i][n] - sum_ax) / aug[i][pivot_col]
        if track_steps:
            steps.append(
                GaussStep(
                    step=step_num,
                    action="back_substitute",
                    matrix=[row[:] for row in aug],
                    variable=pivot_col,
                    value=x[pivot_col],
                    description=f"x{pivot_col} = {x[pivot_col]:.6f}",
                )
            )
            step_num += 1

    det = None
    if rank == n:
        det = 1.0
        for i in range(n):
            det *= aug[i][i]
        if swaps % 2 == 1:
            det = -det

    if track_steps:
        steps.append(
            GaussStep(
                step=step_num,
                action="done",
                matrix=[row[:] for row in aug],
                description=f"Solución: {[f'{v:.6f}' for v in x]}",
            )
        )

    return GaussResult(
        solution=x,
        steps=steps,
        determinant=det,
        rank=rank,
        success=True,
        message="Resuelto correctamente",
    )


def verify_solution(
    matrix: list[list[float]],
    vector: list[float],
    solution: list[float],
    tol: float = 1e-9,
) -> tuple[bool, float]:
    n = len(matrix)
    max_err = 0.0
    for i in range(n):
        ax = sum(matrix[i][j] * solution[j] for j in range(n))
        err = abs(ax - vector[i])
        max_err = max(max_err, err)
    return max_err < tol, max_err
