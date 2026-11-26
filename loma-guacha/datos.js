/* Loma Guacha · DATOS DE LA WEB
   Único archivo que cambia después de publicada (precios, estados, contacto).
   estado: disponible | reservado | vendido | a-confirmar   ·   precio: número en USD o null (muestra "Consultar")
   modoBorrador: true muestra el aviso de BORRADOR; pasar a false para publicar.
   pin: ubicación exacta (pin de Google Maps) que abre el botón "Abrir en Google Maps". */
window.PROYECTO = {
 "slug": "loma-guacha",
 "nombre": "Loma Guacha",
 "tipo": "loteo",
 "modoBorrador": true,
 "logoHero": "img/logo-blanco.png",
 "logoNav": "img/logo-blanco.png",
 "logoNavOscuro": "img/logo-negro.png",
 "agente": {
  "nombre": "Guillermo Raffetti",
  "whatsapp": "5492944969700",
  "mail": "guillermo.raffetti@patagonicapropiedades.com.ar"
 },
 "contactos": [
  {
   "nombre": "Guillermo Raffetti",
   "whatsapp": "5492944969700",
   "telefono": "+54 9 2944 96-9700",
   "mail": "guillermo.raffetti@patagonicapropiedades.com.ar"
  },
  {
   "nombre": "Silvestre Sere",
   "whatsapp": "5491163734990",
   "telefono": "+54 9 11 6373-4990",
   "mail": "silvestre.sere@patagonicapropiedades.com.ar"
  }
 ],
 "comercializa": {
  "direccion": "Cerro Bayo 69, Of. 3 · Villa La Angostura, Neuquén",
  "instagram": "https://www.instagram.com/patagonicapropiedades/",
  "instagramUsuario": "@Patagonicapropiedades"
 },
 "pin": {
  "lat": -40.815310,
  "lng": -71.574676,
  "googleMaps": "https://maps.app.goo.gl/fst5Bn85RRC1Dm43A"
 },
 "seo": {
  "titulo": "Loma Guacha · Lotes desde 4.500 m² en Villa La Angostura",
  "descripcion": "36 parcelas sobre Ruta 40, desde 4.500 m², con hasta dos viviendas por lote y 3,6 ha de espacio verde. En condiciones de escriturar."
 },
 "og": "img/hero.webp",
 "secciones": [
  "hero",
  "proyecto",
  "diferencial",
  "explorador",
  "servicios",
  "galeria",
  "ubicacion",
  "equipo",
  "cierre"
 ],
 "hero": {
  "imagen": "img/hero.webp",
  "eyebrow": "Loteo · Ruta 40 · Villa La Angostura",
  "claim": "El único loteo de Villa La Angostura con *4.500 m² de mínimo.*",
  "cta1": "Ver el masterplan",
  "cta2": "Consultar disponibilidad"
 },
 "proyecto": {
  "eyebrow": "El proyecto",
  "titulo": "Un loteo donde el mínimo *es el argumento.*",
  "texto": "El lote promedio que se comercializa en Villa La Angostura está entre 600 y 1.500 m². Loma Guacha empieza en 4.500. Esa sola decisión define todo lo demás: cuánto bosque queda en pie, a qué distancia está tu casa de la del vecino, y que en cada parcela entren dos viviendas sin que ninguna pierda privacidad.",
  "cifras": [
   {
    "valor": "36",
    "etiqueta": "parcelas"
   },
   {
    "valor": "4.500 m²",
    "etiqueta": "superficie mínima"
   },
   {
    "valor": "2",
    "etiqueta": "viviendas por lote"
   },
   {
    "valor": "3,6 ha",
    "etiqueta": "de espacio verde"
   }
  ],
  "atributos": [
   {
    "titulo": "Vivir adentro del bosque",
    "texto": "Cipreses y coihues en pie, calles internas de 15 metros con traza abierta que acompaña el relieve en vez de cuadricularlo.",
    "imagen": "img/bosque.webp"
   },
   {
    "titulo": "El loteo ya tiene obra",
    "texto": "Hay casas construidas y habitadas adentro del fraccionamiento. No es un proyecto en el papel: se camina, se ve y se toca.",
    "imagen": "img/casa-piedra.webp"
   },
   {
    "titulo": "Ocho lotes miran el lago",
    "texto": "Desde la cota alta, la vista abre sobre el Nahuel Huapi y la cordillera. Ocho de las parcelas disponibles tienen esa orientación.",
    "imagen": "img/vista-lago.webp"
   }
  ]
 },
 "diferencial": {
  "imagen": "img/reserva.webp",
  "eyebrow": "Espacio verde",
  "titulo": "3,6 hectáreas que *nadie va a tocar.*",
  "texto": "El Espacio Verde del fraccionamiento ocupa 3,6 hectáreas sobre el flanco este y es superficie que no se edifica. Tres de las parcelas —B4, B5 y B6— lindan directamente con él. A eso se suman dos reservas fiscales sobre el borde oeste.",
  "datos": [
   {
    "valor": "3,6 ha",
    "etiqueta": "de espacio verde"
   },
   {
    "valor": "15 m",
    "etiqueta": "de ancho de calle interna"
   }
  ]
 },
 "explorador": {
  "eyebrow": "Masterplan",
  "titulo": "Elegí *tu lote.*",
  "bajada": "36 parcelas entre 4.500 y 6.263 m². Tocá cada una para ver superficie, orientación y precio.",
  "aclaracion": "Plano ilustrativo. Superficies según plano de mensura, unificación y fraccionamiento.",
  "niveles": [
   {
    "id": "masterplan",
    "nombre": "Loma Guacha",
    "plano": "img/masterplan.webp",
    "w": 1365,
    "h": 1600,
    "nota": "En verde, el Espacio Verde y las reservas fiscales: superficie que no se edifica.",
    "unidades": [
     {
      "id": "a1",
      "nombre": "Lote A1",
      "etiqueta": "A1",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4507
      },
      "total": 4507,
      "datos": {
       "Ubicación": "Casa construida · fuera de venta",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "12,13 11,96 20,98 11,117 12,198 175,230 175,126 161,126 165,111 175,119 174,13"
     },
     {
      "id": "a2",
      "nombre": "Lote A2",
      "etiqueta": "A2",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4509
      },
      "total": 4509,
      "datos": {
       "Ubicación": "Contrafrente a tierras fiscales",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "179,13 178,231 322,259 322,150 313,149 322,141 322,17 291,25 280,13"
     },
     {
      "id": "a3",
      "nombre": "Lote A3",
      "etiqueta": "A3",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4879
      },
      "total": 4879,
      "datos": {
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "325,17 325,260 338,256 341,264 465,287 464,13"
     },
     {
      "id": "a4",
      "nombre": "Lote A4",
      "etiqueta": "A4",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4550
      },
      "total": 4550,
      "datos": {
       "Ubicación": "Contrafrente a tierras fiscales",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "468,13 468,139 476,153 468,162 468,272 478,289 589,291 591,16"
     },
     {
      "id": "a5",
      "nombre": "Lote A5",
      "etiqueta": "A5",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4500
      },
      "total": 4500,
      "datos": {
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "595,13 593,289 713,290 715,14"
     },
     {
      "id": "a6",
      "nombre": "Lote A6",
      "etiqueta": "A6",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4500
      },
      "total": 4500,
      "datos": {
       "Ubicación": "Contrafrente a tierras fiscales",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "838,13 718,14 719,290 840,289"
     },
     {
      "id": "a7",
      "nombre": "Lote A7",
      "etiqueta": "A7",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4605
      },
      "total": 4605,
      "datos": {
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "843,13 843,289 872,283 934,303 945,292 992,51 900,14"
     },
     {
      "id": "a8",
      "nombre": "Lote A8",
      "etiqueta": "A8",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4502
      },
      "total": 4502,
      "datos": {
       "Ubicación": "Contrafrente a tierras fiscales",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "995,53 944,306 1048,345 1136,103"
     },
     {
      "id": "a9",
      "nombre": "Lote A9",
      "etiqueta": "A9",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4504
      },
      "total": 4504,
      "datos": {
       "Ubicación": "Doble lindero fiscal: fondo y lateral",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "1140,104 1051,344 1124,374 1162,368 1273,167 1250,144"
     },
     {
      "id": "a10",
      "nombre": "Lote A10",
      "etiqueta": "A10",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4502
      },
      "total": 4502,
      "datos": {
       "Ubicación": "Frente sobre Ruta 40 pavimentada",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 220000,
      "estado": "disponible",
      "poligono": "1053,1137 926,1192 1000,1408 1082,1367 1085,1351 1136,1338 1127,1298"
     },
     {
      "id": "a11",
      "nombre": "Lote A11",
      "etiqueta": "A11",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4561
      },
      "total": 4561,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "Frente sobre Ruta 40 pavimentada",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 220000,
      "estado": "disponible",
      "poligono": "924,1194 863,1214 816,1215 840,1473 885,1464 901,1447 947,1437 998,1410"
     },
     {
      "id": "a12",
      "nombre": "Lote A12",
      "etiqueta": "A12",
      "tipologia": "Manzana A",
      "sup": {
       "terreno": 4501
      },
      "total": 4501,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "Esquina, con dos frentes",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 220000,
      "estado": "disponible",
      "poligono": "587,1247 589,1271 837,1472 813,1214 601,1236"
     },
     {
      "id": "b1",
      "nombre": "Lote B1",
      "etiqueta": "B1",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4598
      },
      "total": 4598,
      "datos": {
       "Ubicación": "Lindero a la Reserva Fiscal 1",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 150000,
      "estado": "disponible",
      "poligono": "310,310 325,330 303,322 300,468 306,486 319,487 309,494 318,521 369,513 357,525 409,530 410,542 459,562 459,414 446,414 458,407 457,332"
     },
     {
      "id": "b2",
      "nombre": "Lote B2",
      "etiqueta": "B2",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4533
      },
      "total": 4533,
      "datos": {
       "Ubicación": "Interno, entre dos calles",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 160000,
      "estado": "disponible",
      "poligono": "462,333 463,565 593,625 595,335"
     },
     {
      "id": "b3",
      "nombre": "Lote B3",
      "etiqueta": "B3",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 5154
      },
      "total": 5154,
      "datos": {
       "Ubicación": "El de mayor superficie de su banda",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 160000,
      "estado": "disponible",
      "poligono": "597,334 595,624 716,686 716,335"
     },
     {
      "id": "b4",
      "nombre": "Lote B4",
      "etiqueta": "B4",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4500
      },
      "total": 4500,
      "datos": {
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "719,335 719,542 879,543 881,335 863,341"
     },
     {
      "id": "b5",
      "nombre": "Lote B5",
      "etiqueta": "B5",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4504
      },
      "total": 4504,
      "datos": {
       "Ubicación": "Lindero al Espacio Verde",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "883,345 885,543 902,543 926,505 1140,498 1167,476 1167,452 1152,435 1140,440 1126,425 906,340"
     },
     {
      "id": "b6",
      "nombre": "Lote B6",
      "etiqueta": "B6",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4506
      },
      "total": 4506,
      "datos": {
       "Ubicación": "Lindero al Espacio Verde · forma en L hacia la cota 900",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "719,547 721,689 735,682 737,699 828,740 865,734 918,682 921,638 858,631 907,616 897,584 901,546"
     },
     {
      "id": "b7",
      "nombre": "Lote B7",
      "etiqueta": "B7",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4502
      },
      "total": 4502,
      "datos": {
       "Ubicación": "Lindero a la Reserva Fiscal 1",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "163,434 165,652 198,693 271,731 301,731 316,715 317,689 278,634 275,607 289,550 316,534 297,476 201,446 179,456 172,443 180,439"
     },
     {
      "id": "b8",
      "nombre": "Lote B8",
      "etiqueta": "B8",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4512
      },
      "total": 4512,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "Sector oeste del loteo",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 350000,
      "estado": "disponible",
      "poligono": "11,389 23,396 11,407 11,494 19,499 11,516 12,595 122,661 161,653 160,433"
     },
     {
      "id": "b9",
      "nombre": "Lote B9",
      "etiqueta": "B9",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4503
      },
      "total": 4503,
      "datos": {
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "11,598 11,752 29,755 12,766 12,849 24,855 12,863 12,902 123,967 123,728 108,696 120,663"
     },
     {
      "id": "b10",
      "nombre": "Lote B10",
      "etiqueta": "B10",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4557
      },
      "total": 4557,
      "datos": {
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "126,731 126,831 135,834 135,851 126,852 126,968 256,1040 256,773 177,732"
     },
     {
      "id": "b11",
      "nombre": "Lote B11",
      "etiqueta": "B11",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4701
      },
      "total": 4701,
      "datos": {
       "Ubicación": "Consultar",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "a-confirmar",
      "poligono": "259,785 259,1040 391,1072 390,843 326,769 287,778 293,793"
     },
     {
      "id": "b12",
      "nombre": "Lote B12",
      "etiqueta": "B12",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 5419
      },
      "total": 5419,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "El de mayor superficie a la venta",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 350000,
      "estado": "disponible",
      "poligono": "368,703 329,769 394,842 394,1071 514,1073 516,834"
     },
     {
      "id": "b13",
      "nombre": "Lote B13",
      "etiqueta": "B13",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4502
      },
      "total": 4502,
      "datos": {
       "Ubicación": "Frente amplio sobre la curva",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 190000,
      "estado": "disponible",
      "poligono": "333,574 321,607 348,640 368,699 517,829 584,670 399,585 379,586 369,573"
     },
     {
      "id": "b14",
      "nombre": "Lote B14",
      "etiqueta": "B14",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4510
      },
      "total": 4510,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "Centro del loteo",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 320000,
      "estado": "disponible",
      "poligono": "591,672 519,829 519,1066 704,733"
     },
     {
      "id": "b15",
      "nombre": "Lote B15",
      "etiqueta": "B15",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 6201
      },
      "total": 6201,
      "datos": {
       "Ubicación": "Casa construida · fuera de venta",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "822,798 706,733 520,1073 677,1064"
     },
     {
      "id": "b16",
      "nombre": "Lote B16",
      "etiqueta": "B16",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 5138
      },
      "total": 5138,
      "datos": {
       "Ubicación": "Consultar",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "a-confirmar",
      "poligono": "1009,911 846,811 821,807 681,1063 786,1048"
     },
     {
      "id": "b17",
      "nombre": "Lote B17",
      "etiqueta": "B17",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4851
      },
      "total": 4851,
      "datos": {
       "Ubicación": "Vértice este del loteo",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 140000,
      "estado": "disponible",
      "poligono": "1170,1003 1014,914 884,991 946,1133 1079,1069 1127,1056 1133,1040 1170,1037"
     },
     {
      "id": "b18",
      "nombre": "Lote B18",
      "etiqueta": "B18",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 5266
      },
      "total": 5266,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "Sector este, sobre el vértice",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 350000,
      "estado": "disponible",
      "poligono": "943,1131 881,994 784,1053 611,1076 615,1189 728,1179 733,1170 876,1164"
     },
     {
      "id": "b19",
      "nombre": "Lote B19",
      "etiqueta": "B19",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 5449
      },
      "total": 5449,
      "datos": {
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "vendido",
      "poligono": "396,1076 394,1299 547,1297 533,1269 537,1225 564,1200 612,1189 608,1076"
     },
     {
      "id": "b20",
      "nombre": "Lote B20",
      "etiqueta": "B20",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 5214
      },
      "total": 5214,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "El de mayor superficie de su banda",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 210000,
      "estado": "disponible",
      "poligono": "396,1303 526,1491 704,1487 758,1471 552,1300"
     },
     {
      "id": "b21",
      "nombre": "Lote B21",
      "etiqueta": "B21",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4502
      },
      "total": 4502,
      "datos": {
       "Vista": "Al lago Nahuel Huapi",
       "Ubicación": "Frente sur del fraccionamiento",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": 210000,
      "estado": "disponible",
      "poligono": "196,1294 392,1503 422,1512 523,1494 394,1305"
     },
     {
      "id": "b22",
      "nombre": "Lote B22",
      "etiqueta": "B22",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4506
      },
      "total": 4506,
      "datos": {
       "Ubicación": "Consultar",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "a-confirmar",
      "poligono": "132,1318 132,1354 168,1348 159,1366 132,1362 132,1590 214,1579 331,1536 342,1515 162,1323"
     },
     {
      "id": "b23",
      "nombre": "Lote B23",
      "etiqueta": "B23",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 4504
      },
      "total": 4504,
      "datos": {
       "Ubicación": "Consultar",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "a-confirmar",
      "poligono": "108,1293 12,1323 11,1577 50,1588 130,1589 130,1318"
     },
     {
      "id": "b24",
      "nombre": "Lote B24",
      "etiqueta": "B24",
      "tipologia": "Manzana B",
      "sup": {
       "terreno": 6263
      },
      "total": 6263,
      "datos": {
       "Ubicación": "Consultar · lindero a la Reserva Fiscal 2",
       "Viviendas permitidas": "hasta 2"
      },
      "precio": null,
      "estado": "a-confirmar",
      "poligono": "12,906 15,1320 106,1291 113,1254 147,1235 147,988"
     }
    ]
   }
  ]
 },
 "servicios": {
  "titulo": "Lo que ya está *resuelto.*",
  "items": [
   {
    "icono": "llave",
    "titulo": "En condiciones de escriturar",
    "texto": "Con plano de mensura, unificación y fraccionamiento."
   },
   {
    "icono": "casa",
    "titulo": "Hasta dos viviendas por lote",
    "texto": "Casa principal y casa de huéspedes en la misma parcela."
   },
   {
    "icono": "luz",
    "titulo": "Servicios subterráneos",
    "marca": "En proceso",
    "texto": "En proceso, a cargo del desarrollador: sin postes ni cables a la vista en todo el fraccionamiento."
   },
   {
    "icono": "bosque",
    "titulo": "3,6 ha de espacio verde",
    "texto": "Más dos reservas fiscales sobre el borde oeste."
   },
   {
    "icono": "montana",
    "titulo": "Acceso pavimentado",
    "texto": "Entrada directa desde la Ruta Nacional 40, los doce meses."
   },
   {
    "icono": "agua",
    "titulo": "Vista al lago en 8 lotes",
    "texto": "Orientación sobre el Nahuel Huapi desde la cota alta."
   }
  ]
 },
 "galeria": {
  "titulo": "El bosque, el lago *y las calles.*",
  "imagenes": [
   {
    "src": "img/galeria-1.webp",
    "alt": "Vista aérea del Nahuel Huapi con las islas y la cordillera nevada"
   },
   {
    "src": "img/galeria-2.webp",
    "alt": "El lago desde la cota alta del loteo, entre el bosque de cipreses"
   },
   {
    "src": "img/galeria-3.webp",
    "alt": "Casa de madera y chapa construida adentro del fraccionamiento"
   },
   {
    "src": "img/galeria-4.webp",
    "alt": "Casa de piedra y madera entre los árboles del loteo"
   },
   {
    "src": "img/galeria-5.webp",
    "alt": "Vista aérea del bosque con el lago y Villa La Angostura al fondo"
   },
   {
    "src": "img/galeria-6.webp",
    "alt": "El Nahuel Huapi y la cordillera desde el aire"
   },
   {
    "src": "img/galeria-7.webp",
    "alt": "Calle interna de tierra entre cipreses altos"
   },
   {
    "src": "img/galeria-8.webp",
    "alt": "Camino del loteo abriéndose entre el bosque nativo"
   }
  ],
  "aclaracion": "Fotos del loteo tomadas en octubre de 2026."
 },
 "ubicacion": {
  "titulo": "Sobre la Ruta 40, *a 4 minutos de Puerto Manzano.*",
  "texto": "Loma Guacha está en el corredor de Puerto Manzano y Cumelén, más cerca de ese sector que del centro de la Villa. Acceso pavimentado hasta la entrada, 11 minutos al centro y 64 km al aeropuerto de Bariloche.",
  "lat": -40.817642,
  "lng": -71.572676,
  "zona": "Ruta 40",
  "rotulo": "Ruta 40 · Villa La Angostura",
  "referencias": [
   "puerto-manzano",
   "cumelen",
   "centro",
   "cerro-bayo",
   "las-balsas",
   "bahia-mansa"
  ],
  "tiempos": [
   {
    "id": "puerto-manzano",
    "nombre": "Puerto Manzano",
    "tiempo": "4 min"
   },
   {
    "id": "cumelen",
    "nombre": "Cumelén",
    "tiempo": "6 min"
   },
   {
    "id": "las-balsas",
    "nombre": "Las Balsas",
    "tiempo": "8 min"
   },
   {
    "id": "centro",
    "nombre": "Centro de la Villa",
    "tiempo": "11 min"
   },
   {
    "id": "bahia-mansa",
    "nombre": "Bosque de Arrayanes",
    "tiempo": "14 min"
   },
   {
    "id": "cerro-bayo",
    "nombre": "Cerro Bayo",
    "tiempo": "19 min"
   }
  ]
 },
 "equipo": {
  "roles": [
   {
    "rol": "Desarrolla y comercializa",
    "nombre": "Patagónica Propiedades",
    "logo": "img/patagonica-color.png"
   }
  ]
 },
 "cierre": {
  "imagen": "img/cierre.webp",
  "titulo": "Lotes desde *USD 140.000*",
  "texto": "22 parcelas disponibles, 8 de ellas con vista al lago. La visita se hace caminando el lote con el plano en la mano."
 },
 "legal": "Superficies y linderos según plano de mensura, unificación y fraccionamiento. Las imágenes aéreas son ilustrativas del entorno. Precios en dólares estadounidenses, sujetos a confirmación."
};
