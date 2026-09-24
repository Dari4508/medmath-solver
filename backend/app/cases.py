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
    "matrix_coefficients": [[0.154, 0.0, 0.0], [0.0, 0.2, 0.4], [0.154, 0.2, 0.0]],
    "constants_vector": [77.0, 160.0, 117.0],
    "expected_solution": [500.0, 200.0, 300.0],
    "variables": ["ml_NaCl_09", "ml_KCl_20", "ml_KCl_40"],
    "units": ["ml", "ml", "ml"],
    "clinical_notes": (
        "Coeficientes en mEq/mL: NaCl 0.9% = 0.154 mEq/mL Na/Cl; "
        "KCl 20 mEq/100 mL = 0.2 mEq/mL; KCl 40 mEq/100 mL = 0.4 mEq/mL. "
        "Objetivo: 500 mL NaCl 0.9% (77 mEq Na/Cl), 200 mL KCl 20 (40 mEq K), "
        "300 mL KCl 40 (120 mEq K) → 160 mEq K total. "
        "Fila 2: NaCl + KCl_20 (Na + K de bolsa 2) = 77 + 40 = 117. "
        "Verificar K+ sérico previo."
    ),
    "is_active": True,
}


KCL_CASE = {
    "name": "Reposición Potasio - KCl 20/40 mEq (2x2)",
    "description": (
        "Mezcla de bolsas KCl 20 mEq/100 mL y 40 mEq/100 mL para alcanzar "
        "70 mEq de K+ en un volumen total de 250 mL (protocolo de reposición "
        "de potasio en hipokalemia)."
    ),
    "reference_source": (
        "Vanderbilt University Medical Center — Electrolyte Repletion "
        "Guideline (PMG), Surgical Critical Care"
    ),
    "reference_url": (
        "https://www.vumc.org/trauma-and-scc/sites/default/files/"
        "public_files/Protocols/Electrolyte%20Repletion%20Guideline%20PMG.pdf"
    ),
    "matrix_coefficients": [[0.2, 0.4], [1.0, 1.0]],
    "constants_vector": [70.0, 250.0],
    "expected_solution": [150.0, 100.0],
    "variables": ["ml_KCl_20", "ml_KCl_40"],
    "units": ["ml", "ml"],
    "clinical_notes": (
        "KCl 20 mEq/100 mL = 0.2 mEq/mL; KCl 40 mEq/100 mL = 0.4 mEq/mL. "
        "Vía periférica: máx 10 mEq/h. Vía central con monitorización "
        "cardíaca: hasta 20 mEq/h (máx 40 mEq/h). Verificar K+ sérico "
        "previo y reevaluar con próximos laboratorios. Riesgo de flebitis "
        "y dolor en sitio de infusión."
    ),
    "is_active": True,
}

BICARB_CASE = {
    "name": "Corrección Acidosis - NaHCO₃ 8.4%/4.2% (2x2)",
    "description": (
        "Mezcla de bicarbonato de sodio 8.4% (1 mEq/mL) y 4.2% (0.5 mEq/mL) "
        "para preparar 200 mEq de HCO₃⁻ en 300 mL de dilución final, "
        "usado en corrección de acidosis metabólica."
    ),
    "reference_source": (
        "DailyMed (NLM/FDA) — Sodium Bicarbonate Injection, USP prescribing "
        "information (8.4% y 4.2%)"
    ),
    "reference_url": (
        "https://dailymed.nlm.nih.gov/dailymed/lookup.cfm"
        "?setid=a26d709b-b294-4b02-9a88-7e840f099a33"
    ),
    "matrix_coefficients": [[1.0, 0.5], [1.0, 1.0]],
    "constants_vector": [200.0, 300.0],
    "expected_solution": [100.0, 200.0],
    "variables": ["ml_NaHCO3_84", "ml_NaHCO3_42"],
    "units": ["ml", "ml"],
    "clinical_notes": (
        "NaHCO₃ 8.4% = 1 mEq/mL; 4.2% = 0.5 mEq/mL. Hipertónico — puede "
        "elevar Na sérico. Corregir hipopotasemia e hipocalcemia previas "
        "o concomitantes. Monitorizar gases arteriales, osmolaridad y "
        "ritmo cardíaco. En paro cardíaco: 1 mmol/kg IV inicial."
    ),
    "is_active": True,
}

PN_CASE = {
    "name": "Nutrición Parenteral - AA10% + G50% (2x2)",
    "description": (
        "Mezcla de aminoácidos 10% (0.4 kcal/mL) y dextrosa 50% "
        "(1.7 kcal/mL) para formular 500 mL de nutrición parenteral "
        "proporcionando 590 kcal no proteicos."
    ),
    "reference_source": (
        "ESPEN (European Society for Clinical Nutrition and Metabolism) — "
        "Guidelines on Parenteral Nutrition"
    ),
    "reference_url": "https://espen.org/guidelines",
    "matrix_coefficients": [[0.4, 1.7], [1.0, 1.0]],
    "constants_vector": [590.0, 500.0],
    "expected_solution": [200.0, 300.0],
    "variables": ["ml_AA_10", "ml_G50"],
    "units": ["ml", "ml"],
    "clinical_notes": (
        "AA 10%: 4 kcal/g (0.4 kcal/mL). Dextrosa 50%: 3.4 kcal/g "
        "(1.7 kcal/mL). Relación glucosa/lípidos recomendada 70-85% "
        "glucosa en PN a largo plazo. No proteico: 100-150 kcal por "
        "gramo de nitrógeno (ESPEN). Monitorizar glucemia; infusión "
        "máx 5-7 mg/kg/min de glucosa."
    ),
    "is_active": True,
}


def seed_cases(db):
    from app.models import MedicalCase

    for case_data in [D10W_CASE, ELECTROLYTES_CASE, KCL_CASE, BICARB_CASE, PN_CASE]:
        existing = db.query(MedicalCase).filter_by(name=case_data["name"]).first()
        if not existing:
            db.add(MedicalCase(**case_data))
        else:
            existing.matrix_coefficients = case_data["matrix_coefficients"]
            existing.constants_vector = case_data["constants_vector"]
            existing.expected_solution = case_data["expected_solution"]
            existing.clinical_notes = case_data["clinical_notes"]
    db.commit()
