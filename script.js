console.log("Скрипт запущен! Инициализация холстов...");

const canvasFront = new fabric.Canvas('tshirt-canvas-front', { preserveObjectStacking: true });
const canvasBack = new fabric.Canvas('tshirt-canvas-back', { preserveObjectStacking: true });

let currentCanvas = canvasFront;
let baseFront, shadowFront;
let baseBack, shadowBack;

// ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ
function loadImage(url, canvas, isShadow, callback) {
    console.log(`Попытка загрузить: ${url}`);
    
    fabric.Image.fromURL(url, (img) => {
        if (!img) {
            console.error(`❌ ОШИБКА: Файл ${url} не загрузился!`);
            return;
        }
        
        console.log(`✅ УСПЕХ: Файл ${url} загружен!`);
        
        // Подгоняем размер картинки точно под размер холста
        img.scaleToWidth(canvas.width);
        img.scaleToHeight(canvas.height);

        img.set({
            selectable: false,
            evented: false,
            originX: 'left',
            originY: 'top',
            globalCompositeOperation: isShadow ? 'multiply' : 'source-over'
        });

        canvas.add(img);
        
        if (!isShadow) {
            canvas.sendToBack(img);
        }
        
        if (callback) callback(img);

        // КРИТИЧНОЕ ИСПРАВЛЕНИЕ: принудительно отрисовываем холст после добавления картинки
        canvas.renderAll(); 
    });
}

function initMockup() {
    loadImage('front-base.png', canvasFront, false, (img) => { baseFront = img; });
    loadImage('front-shadows.png', canvasFront, true, (img) => { shadowFront = img; });

    loadImage('back-base.png', canvasBack, false, (img) => { baseBack = img; });
    loadImage('back-shadows.png', canvasBack, true, (img) => { shadowBack = img; });
}

initMockup();

// Изменение цвета
document.getElementById('shirt-color').addEventListener('input', (e) => {
    const color = e.target.value;
    console.log(`Меняем цвет на: ${color}`);
    
    const filter = new fabric.Image.filters.BlendColor({
        color: color,
        mode: 'tint',
        alpha: 1
    });

    if (baseFront) {
        baseFront.filters[0] = filter;
        baseFront.applyFilters();
        canvasFront.renderAll();
    }
    if (baseBack) {
        baseBack.filters[0] = filter;
        baseBack.applyFilters();
        canvasBack.renderAll();
    }
});

// Загрузка пользовательского принта
document.getElementById('image-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const imgObj = new Image();
        imgObj.src = event.target.result;
        imgObj.onload = () => {
            const fabricImage = new fabric.Image(imgObj);
            
            fabricImage.set({
                left: currentCanvas.width / 2,
                top: currentCanvas.height / 2,
                originX: 'center',
                originY: 'center',
                globalCompositeOperation: 'source-atop',
                borderColor: '#007bff',
                cornerColor: '#007bff',
                cornerSize: 10,
                transparentCorners: false
            });
            
            if (fabricImage.width > 200) fabricImage.scaleToWidth(200);

            currentCanvas.add(fabricImage);
            
            const shadow = currentCanvas === canvasFront ? shadowFront : shadowBack;
            if (shadow) currentCanvas.bringToFront(shadow);
            
            currentCanvas.setActiveObject(fabricImage);
            currentCanvas.renderAll();
            e.target.value = '';
        }
    }
    reader.readAsDataURL(file);
});

// Переключение сторон
document.querySelectorAll('input[name="shirt-view"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'front') {
            document.getElementById('front-view').style.display = 'block';
            document.getElementById('back-view').style.display = 'none';
            currentCanvas = canvasFront;
        } else {
            document.getElementById('front-view').style.display = 'none';
            document.getElementById('back-view').style.display = 'block';
            currentCanvas = canvasBack;
        }
        // Перерисовываем активный холст при переключении
        currentCanvas.renderAll();
    });
});

// Экспорт
document.getElementById('download-btn').addEventListener('click', () => {
    currentCanvas.discardActiveObject();
    currentCanvas.renderAll();
    
    const dataURL = currentCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
    });
    
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `mockup-${currentCanvas === canvasFront ? 'front' : 'back'}.png`;
    link.click();
});
