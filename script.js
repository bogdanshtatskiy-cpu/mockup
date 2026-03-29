// Инициализация холстов. preserveObjectStacking не дает выбранному объекту прыгать поверх теней
const canvasFront = new fabric.Canvas('tshirt-canvas-front', { preserveObjectStacking: true });
const canvasBack = new fabric.Canvas('tshirt-canvas-back', { preserveObjectStacking: true });

// Переменная для отслеживания активной стороны
let currentCanvas = canvasFront;

// Переменные для хранения системных слоев
let baseFront, shadowFront;
let baseBack, shadowBack;

// 1. ФУНКЦИЯ ЗАГРУЗКИ ШАБЛОНОВ (БАЗЫ И ТЕНЕЙ)
function initMockup() {
    // --- ЗАГРУЗКА ПЕРЕДА ---
    fabric.Image.fromURL('front-base.png', (img) => {
        baseFront = img;
        baseFront.set({ selectable: false, evented: false });
        canvasFront.add(baseFront);
        canvasFront.sendToBack(baseFront);
    });

    fabric.Image.fromURL('front-shadows.png', (img) => {
        shadowFront = img;
        shadowFront.set({ 
            selectable: false, 
            evented: false,
            globalCompositeOperation: 'multiply' // Режим умножения для складок
        });
        canvasFront.add(shadowFront);
    });

    // --- ЗАГРУЗКА СПИНЫ ---
    fabric.Image.fromURL('back-base.png', (img) => {
        baseBack = img;
        baseBack.set({ selectable: false, evented: false });
        canvasBack.add(baseBack);
        canvasBack.sendToBack(baseBack);
    });

    fabric.Image.fromURL('back-shadows.png', (img) => {
        shadowBack = img;
        shadowBack.set({ 
            selectable: false, 
            evented: false,
            globalCompositeOperation: 'multiply'
        });
        canvasBack.add(shadowBack);
    });
}

// Запускаем загрузку шаблонов при открытии страницы
initMockup();

// 2. ИЗМЕНЕНИЕ ЦВЕТА ФУТБОЛКИ
document.getElementById('shirt-color').addEventListener('input', (e) => {
    const color = e.target.value;
    
    // Создаем фильтр для перекрашивания
    const filter = new fabric.Image.filters.BlendColor({
        color: color,
        mode: 'tint',
        alpha: 1
    });

    // Применяем фильтр к базе спереди
    if (baseFront) {
        baseFront.filters[0] = filter;
        baseFront.applyFilters();
        canvasFront.renderAll();
    }
    
    // Применяем фильтр к базе сзади
    if (baseBack) {
        baseBack.filters[0] = filter;
        baseBack.applyFilters();
        canvasBack.renderAll();
    }
});

// 3. ЗАГРУЗКА ИЗОБРАЖЕНИЯ НА ФУТБОЛКУ
document.getElementById('image-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const imgObj = new Image();
        imgObj.src = event.target.result;
        imgObj.onload = () => {
            const fabricImage = new fabric.Image(imgObj);
            
            // Настройки загруженной картинки
            fabricImage.set({
                left: currentCanvas.width / 2,
                top: currentCanvas.height / 2,
                originX: 'center',
                originY: 'center',
                globalCompositeOperation: 'source-atop', // Обрезает картинку по контуру базы
                borderColor: '#007bff',
                cornerColor: '#007bff',
                cornerSize: 10,
                transparentCorners: false
            });
            
            // Масштабируем, если картинка огромная
            if (fabricImage.width > 200) {
                fabricImage.scaleToWidth(200);
            }

            currentCanvas.add(fabricImage);
            
            // Убеждаемся, что тени остались поверх новой картинки
            const shadow = currentCanvas === canvasFront ? shadowFront : shadowBack;
            if (shadow) {
                currentCanvas.bringToFront(shadow);
            }
            
            // Делаем добавленную картинку активной для редактирования
            currentCanvas.setActiveObject(fabricImage);
            currentCanvas.renderAll();
            
            // Очищаем input, чтобы можно было загрузить ту же картинку еще раз
            e.target.value = '';
        }
    }
    reader.readAsDataURL(file);
});

// 4. ПЕРЕКЛЮЧЕНИЕ СТОРОН (СПЕРЕДИ / СЗАДИ)
const viewRadios = document.querySelectorAll('input[name="shirt-view"]');
const frontView = document.getElementById('front-view');
const backView = document.getElementById('back-view');

viewRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'front') {
            frontView.style.display = 'block';
            backView.style.display = 'none';
            currentCanvas = canvasFront;
        } else {
            frontView.style.display = 'none';
            backView.style.display = 'block';
            currentCanvas = canvasBack;
        }
    });
});

// 5. СКАЧИВАНИЕ РЕЗУЛЬТАТА
document.getElementById('download-btn').addEventListener('click', () => {
    // Убираем рамки выделения с активного объекта перед сохранением
    currentCanvas.discardActiveObject();
    currentCanvas.renderAll();
    
    // Генерируем изображение
    const dataURL = currentCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // Увеличивает качество (разрешение) скачанного файла в 2 раза
    });
    
    // Инициируем скачивание
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `tshirt-mockup-${currentCanvas === canvasFront ? 'front' : 'back'}.png`;
    link.click();
});