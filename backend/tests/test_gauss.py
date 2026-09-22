import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.gauss import gaussian_elimination, verify_solution


def test_d10w_case():
    matrix = [[1.0, 1.0], [0.50, 0.05]]
    vector = [500.0, 50.0]
    result = gaussian_elimination(matrix, vector)
    assert result.success
    assert result.solution is not None
    ok, err = verify_solution(matrix, vector, result.solution)
    assert ok and err < 0.01
    assert abs(result.solution[0] - 55.555555) < 0.01
    assert abs(result.solution[1] - 444.444444) < 0.01


def test_3x3_electrolytes():
    matrix = [[154.0, 0.0, 154.0], [0.0, 20.0, 40.0], [154.0, 20.0, 154.0]]
    vector = [1500.0, 80.0, 1580.0]
    result = gaussian_elimination(matrix, vector)
    assert result.success
    ok, err = verify_solution(matrix, vector, result.solution)
    assert ok and err < 0.01


def test_no_solution():
    matrix = [[1, 1], [1, 1]]
    vector = [1, 2]
    result = gaussian_elimination(matrix, vector)
    assert not result.success
    assert "incompatible" in result.message.lower()


def test_infinite_solutions():
    matrix = [[1, 2], [2, 4]]
    vector = [3, 6]
    result = gaussian_elimination(matrix, vector)
    assert result.success
    assert result.rank < 2


def test_ill_conditioned():
    matrix = [[1 / (i + j + 1) for j in range(4)] for i in range(4)]
    vector = [1, 1, 1, 1]
    result = gaussian_elimination(matrix, vector)
    assert result.success
    assert result.solution is not None


def test_step_tracking_count():
    matrix = [[2, 1], [1, 3]]
    vector = [5, 5]
    result = gaussian_elimination(matrix, vector, track_steps=True)
    assert len(result.steps) >= 4
    actions = [s.action for s in result.steps]
    assert "start" in actions
    assert "eliminate" in actions or "back_substitute" in actions
    assert "done" in actions


def test_verify_solution_exact():
    matrix = [[1, 0], [0, 1]]
    vector = [3, 5]
    solution = [3, 5]
    ok, err = verify_solution(matrix, vector, solution)
    assert ok
    assert err == 0.0


def test_verify_solution_wrong():
    matrix = [[1, 0], [0, 1]]
    vector = [3, 5]
    solution = [3, 99]
    ok, err = verify_solution(matrix, vector, solution)
    assert not ok
    assert err > 0


def test_determinant_sign_after_row_swap():
    r = gaussian_elimination([[1, 2], [3, 4]], [5, 11], track_steps=False)
    assert r.success
    assert abs(r.determinant - (-2.0)) < 1e-9

    r = gaussian_elimination([[0, 1], [1, 0]], [2, 3], track_steps=False)
    assert r.success
    assert abs(r.determinant - (-1.0)) < 1e-9


def test_determinant_no_swap_and_identity():
    r = gaussian_elimination([[2, 0], [0, 3]], [1, 1], track_steps=False)
    assert abs(r.determinant - 6.0) < 1e-9
    r = gaussian_elimination([[1, 0], [0, 1]], [0, 0], track_steps=False)
    assert abs(r.determinant - 1.0) < 1e-9


def test_determinant_3x3_with_swaps():
    matrix = [[0, 2, 0], [3, 0, 0], [0, 0, 4]]
    r = gaussian_elimination(matrix, [0, 0, 0], track_steps=False)
    assert r.success
    # det = 0*0*4 - ... = 24 per column expansion with two row swaps -> sign (+)
    # rows: [0,2,0],[3,0,0],[0,0,4] -> det = -2*3*4 = -24 (odd permutation of diag)
    assert abs(r.determinant - (-24.0)) < 1e-9


def test_inconsistent_leading_zero_column():
    result = gaussian_elimination([[0, 1], [0, 2]], [1, 3], track_steps=False)
    assert not result.success
    assert "incompatible" in result.message.lower()


def test_inconsistent_zero_columns_3x3():
    matrix = [[0, 0, 1], [0, 1, 1], [0, 1, 2]]
    vector = [5, 3, 4]
    result = gaussian_elimination(matrix, vector, track_steps=False)
    assert not result.success
    assert "incompatible" in result.message.lower()


def test_rank_with_leading_zero_column():
    result = gaussian_elimination([[0, 1], [0, 2]], [1, 2], track_steps=False)
    assert result.success
    assert result.rank == 1
    ok, _err = verify_solution([[0, 1], [0, 2]], [1, 2], result.solution)
    assert ok


def test_solution_zero_columns_3x3():
    matrix = [[0, 0, 1], [0, 1, 1], [0, 1, 2]]
    vector = [5, 3, 8]
    result = gaussian_elimination(matrix, vector, track_steps=False)
    assert result.success
    assert result.rank == 2
    ok, err = verify_solution(matrix, vector, result.solution)
    assert ok and err < 1e-9
    assert abs(result.solution[2] - 5.0) < 1e-9
    assert abs(result.solution[1] - (-2.0)) < 1e-9


def test_1x1_system():
    result = gaussian_elimination([[3.0]], [9.0], track_steps=False)
    assert result.success
    assert abs(result.solution[0] - 3.0) < 1e-12
    assert abs(result.determinant - 3.0) < 1e-12
