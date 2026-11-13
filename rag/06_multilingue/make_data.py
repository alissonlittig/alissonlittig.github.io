"""Gera data/tests.json: 24 perguntas (2 por documento; a pergunta SEMPRE está em idioma diferente do documento) + 5 fora do escopo."""
import json, pathlib
H = pathlib.Path(__file__).parent / "data"
Q = [("What time does the space open on Saturday?", "en", 0), ("¿Abren los domingos?", "es", 0),
     ("Qual a senha do wifi?", "pt", 1), ("¿Cómo me conecto a la red inalámbrica?", "es", 1),
     ("Quanto custa estacionar o carro?", "pt", 2), ("Where can I leave my bike?", "en", 2),
     ("Can I cancel a room booking for free?", "en", 3), ("¿Cuánto cobran si cancelo una reserva tarde?", "es", 3),
     ("Posso trazer meu cachorro?", "pt", 4), ("¿Se admiten gatos en las salas?", "es", 4),
     ("Quantas páginas posso imprimir de graça?", "pt", 5), ("How much does printing cost?", "en", 5),
     ("How much is the monthly plan?", "en", 6), ("¿Hay descuento para estudiantes?", "es", 6),
     ("Quando vocês emitem a nota fiscal?", "pt", 7), ("¿Aceptan pago con tarjeta?", "es", 7),
     ("Tem café de graça?", "pt", 8), ("Can I leave food in the fridge?", "en", 8),
     ("How much does a locker cost?", "en", 9), ("¿Dónde se entrega la llave del armario?", "es", 9),
     ("Quantas pessoas cabem na sala de reunião?", "pt", 10), ("¿Hay proyector en la sala?", "es", 10),
     ("Dá para fazer um evento fora do horário?", "pt", 11), ("How much does the main hall cost per hour?", "en", 11)]
OOS = [("Do you have a gym?", "en"), ("¿Cuál es la capital de Francia?", "es"), ("Qual a receita de bolo de cenoura?", "pt"), ("Vocês têm academia?", "pt"), ("¿Venden entradas para conciertos?", "es")]
EXTRA = [("Is there a place to park my car?", "en", 2), ("¿A qué hora cierran los viernes?", "es", 0), ("Aceitam gatos no coworking?", "pt", 4), ("Is the printer on the second floor?", "en", 5),
         ("¿Cuánto cuesta el plan mensual?", "es", 6), ("Como pago a mensalidade?", "pt", 7), ("Podemos usar o projetor?", "pt", 10), ("Where do I return the key?", "en", 9), ("Is coffee free?", "en", 8)]
T = [{"q": q, "lang": l, "doc": d} for q, l, d in Q] + [{"q": q, "lang": l, "doc": None} for q, l in OOS]
T += [{"q": q, "lang": l, "doc": d, "set": "extra"} for q, l, d in EXTRA]
(H / "tests.json").write_text(json.dumps(T, ensure_ascii=False, indent=1), "utf-8"); print(len(T), "perguntas")
