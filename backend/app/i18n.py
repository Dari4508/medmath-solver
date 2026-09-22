MESSAGES: dict[str, dict[str, str]] = {
    "es": {
        "case_not_found": "Caso no encontrado",
        "history_not_found": "Entrada de historial no encontrada",
        "calc_ok": "Resuelto correctamente",
        "calc_incompatible": "Sistema incompatible (sin solución)",
        "history_cleared": "Historial limpiado",
        "history_entry_deleted": "Entrada eliminada",
        "case_created": "Caso creado",
        "case_updated": "Caso actualizado",
        "case_deactivated": "Caso desactivado",
        "invalid_case_name": "Nombre de caso inválido (solo letras, números, espacios y - _ . , : ; ( ) % / +)",
        "duplicate_case_name": "Ya existe un caso con ese nombre",
    },
    "en": {
        "case_not_found": "Case not found",
        "history_not_found": "History entry not found",
        "calc_ok": "Solved successfully",
        "calc_incompatible": "Inconsistent system (no solution)",
        "history_cleared": "History cleared",
        "history_entry_deleted": "Entry deleted",
        "case_created": "Case created",
        "case_updated": "Case updated",
        "case_deactivated": "Case deactivated",
        "invalid_case_name": "Invalid case name (letters, numbers, spaces and - _ . , : ; ( ) % / + only)",
        "duplicate_case_name": "A case with that name already exists",
    },
}


def t(key: str, lang: str = "es") -> str:
    lang = lang if lang in MESSAGES else "es"
    return MESSAGES[lang].get(key, MESSAGES["es"].get(key, key))


def resolve_calc_message(raw: str, lang: str = "es") -> str:
    if raw == "Resuelto correctamente":
        return t("calc_ok", lang)
    if raw.startswith("Sistema incompatible"):
        return t("calc_incompatible", lang)
    return raw
