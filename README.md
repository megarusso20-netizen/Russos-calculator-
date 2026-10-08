# Operación Tormenta

Shooter en primera persona estilo Call of Duty que corre en el navegador (Three.js, un solo archivo).

**Cómo jugar:** abre `index.html` en Chrome, Edge o Firefox y pulsa **Desplegar**. Necesitas teclado y ratón.

| Tecla | Acción |
|---|---|
| W A S D | Moverse |
| Ratón / clic izq. | Apuntar / disparar |
| Clic der. | Mirar por la mira (la M82 usa mira telescópica) |
| Shift | Correr |
| C | Agacharse (corriendo: deslizarse) |
| Espacio | Saltar |
| R | Recargar |
| G | Granada |
| 1–5, rueda, Q | Cambiar arma (5 = RPG-7) |
| V | Cuchillo |
| E | Usar / comprar (modo Zombis) |
| 6 · 7 · 8 | Rachas: UAV, ataque aéreo, helicóptero |
| F | Pantalla completa |
| Esc | Pausa |

Gráficos: en el menú puedes elegir calidad Baja, Media, Alta o Ultra (reflejos, brillo de luces, sombras suaves). Si va lento, baja la calidad.

Mapas: Al-Kharif (desierto), Puerto Viejo (muelle), Base Glaciar (nieve) y Pueblo Atómico (dos casas frente a frente, estilo Nuketown).

Armas: arma principal a elegir (M4A1, AK-47 o MP5), SPAS-12 (escopeta), M82 Barrett (francotirador), M1911 (pistola), RPG-7 (lanzacohetes) y cuchillo.

Oleadas: 15 oleadas con un jefe (Coloso) cada 5; la 15 es el jefe final, General Tormenta. Al ganar puedes seguir en modo infinito.

Móvil: joystick a la izquierda, desliza a la derecha para apuntar y botones en pantalla (gira el móvil en horizontal).
Desde la oleada 2 aparecen chalecos antibalas (absorben el 70 % del daño) y los Pesados sueltan uno al morir.
Los enemigos buscan cobertura, se asoman para disparar y flanquean. Hay oleadas cada vez más grandes,
barriles explosivos, munición que sueltan los enemigos, radar, indicadores de daño y regeneración de salud.

## Modo Zombis

Rondas infinitas de noche, con linterna. Empiezas con la M1911 y 500 puntos: cada impacto da 10, cada baja 60 (100 a la cabeza, 130 con cuchillo).
Con la tecla E compras armas en las pizarras, bebidas con ventajas (Jugo de Hierro, Cola Rápida, Doble Golpe, Revive Exprés) y la caja misteriosa (950), que puede dar el Rayo X-1.
Los zombis a veces sueltan Munición máxima, Baja instantánea, Puntos dobles o Nuke.

## Armería

En el menú, Armería: miras (hierro, punto rojo, holográfica, ACOG 4x), silenciador y cargador ampliado para M4A1, AK-47 y MP5, y camuflajes para todas las armas (desierto, bosque, ártico, tigre, digital y oro).

## Mando (Xbox, PlayStation o genérico, por USB o Bluetooth; también en el móvil)

| Mando | Acción |
|---|---|
| Stick izquierdo (L3 = correr) | Moverse |
| Stick derecho | Apuntar (con asistencia de apuntado opcional) |
| RT / R2 | Disparar |
| LT / L2 | Mirar por la mira |
| A / Cruz | Saltar |
| B / Círculo | Agacharse / deslizarse |
| X / Cuadrado | Recargar (o usar/comprar en Zombis) |
| Y / Triángulo | Cambiar arma |
| RB / R1 | Granada |
| LB / L1 | Usar racha (o comprar en Zombis) |
| R3 | Cuchillo |
| Cruceta | Rachas (arriba UAV, izquierda aéreo, derecha helicóptero, abajo lanzacohetes) |
| Start / Options | Pausa |

En los menús: cruceta o stick para moverte, A para elegir, B para volver y Start para desplegar.

## Subir a Firebase (proyecto playkorsou)

La carpeta `dist/` contiene el juego listo para Firebase Hosting (un solo `index.html` que funciona sin internet externo).
`firebase.json` lo sube a un **sitio aparte** dentro del mismo proyecto, así no se toca la web que ya existe en playkorsou.web.app.

```
npm install -g firebase-tools
firebase login
firebase hosting:sites:create playkorsou-tormenta --project playkorsou
firebase deploy --only hosting --project playkorsou
```

El juego queda en https://playkorsou-tormenta.web.app

Para que los dos juegos convivan en la misma web (https://playkorsou.web.app/tormenta/): descomprime `tormenta-para-playkorsou.zip` dentro de la carpeta pública del proyecto de playkorsou (la que indica `"public"` en su `firebase.json`) y haz `firebase deploy` desde ese proyecto. El menú del juego muestra entonces un botón "Volver a Play Korsou". Si ese `firebase.json` tiene una regla `rewrites` con `"source": "**"`, Firebase igualmente sirve primero los archivos que existen, así que `/tormenta/` carga el juego.
