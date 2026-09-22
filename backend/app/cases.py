D10W_CASE = {
    "name": "Preparación Dextrosa 10% (D10W) 500ml",
    "description": "Mezcla estándar de farmacia hospitalaria: D50W + D5W → D10W usando regla de aleación",
    "reference_source": "Protocolo de Mezclas IV - Hospital General v2024, p.12",
    "reference_url": "https://example-hospital.org/protocolos/mezclas-iv",
    "matrix_coefficients": [[1.0, 1.0], [0.50, 0.05]],
    "constants_vector": [500.0, 50.0],
    "expected_solution": [55.55555555555556, 444.44444444444446],
    "variables": ["ml_D50W", "ml_D5W"],
    "units": ["ml", "ml"],
    "clinical_notes": "Verificar osmolaridad final. D50W es vesicante - usar vena central si >10%. Concentración final: 10% dextrosa = 100g/L.",
    "is_active": True,
}

ELECTROLYTES_CASE = {
    "name": "Nutrición Parenteral - Balance Na/K/Cl (3x3)",
    "description": "Cálculo de volúmenes de 3 bolsas base para alcanzar objetivos de electrolitos en NPT",
    "reference_source": "Guía Práctica Nutrición Parenteral SEEN/SENPE 2023, Caso Estudio 4.2",
    "reference_url": "https://seen.es/guias/npt-casos",
    "matrix_coefficients": [
        [154.0, 0.0, 154.0],
        [0.0, 20.0, 40.0],
        [154.0, 20.0, 154.0],
    ],
    "constants_vector": [1500.0, 80.0, 1580.0],
    "expected_solution": [500.0, 200.0, 300.0],
    "variables": ["ml_NaCl_09", "ml_KCl_20", "ml_KCl_40"],
    "units": ["ml", "ml", "ml"],
    "clinical_notes": "Bolsas estándar: NaCl 0.9% (154 mEq/L Na/Cl), KCl 20 mEq/100ml, KCl 40 mEq/100ml. Verificar K+ sérico previo.",
    "is_active": True,
}


def seed_cases(db):
    from app.models import MedicalCase

    for case_data in [D10W_CASE, ELECTROLYTES_CASE]:
        existing = db.query(MedicalCase).filter_by(name=case_data["name"]).first()
        if not existing:
            db.add(MedicalCase(**case_data))
    db.commit()
