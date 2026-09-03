Turno Fácil
Herramienta de registro de turno fiscal. Desarrollada por Víctor Siu.
Características
Registro completo de casos: aviso policial, efectivo, comisaría, delito, hecho, detención
Alertas automáticas de plazo 48h con semáforo (rojo / ámbar / verde)
Historial con buscador
Compartir casos por WhatsApp
Exportar todo el turno a archivo .txt
PWA: instala en celular, funciona sin internet
Despliegue en GitHub Pages
Sube todos los archivos a un repositorio en GitHub (ej. `VMSiuP/turno-facil`)
Ve a Settings → Pages
En Source, selecciona la rama `main` y carpeta `/ (root)`
Guarda. En unos segundos la app estará en:
`https://vmsiup.github.io/turno-facil/`
Instalar en el celular
Android (Chrome):
Abre la URL en Chrome → menú (⋮) → "Añadir a pantalla de inicio"
iOS (Safari):
Abre la URL en Safari → botón compartir → "Añadir a pantalla de inicio"
Estructura de archivos
```
turno-facil/
├── index.html       ← App principal
├── style.css        ← Estilos
├── app.js           ← Lógica
├── manifest.json    ← Configuración PWA
├── sw.js            ← Service worker (offline)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```
Datos
Los casos se guardan en el dispositivo (localStorage).
Al exportar, se genera un archivo `.txt` con todos los casos del turno.
