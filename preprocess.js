import { filterInputs, filters, inputImage, COLORS, SCALE } from './ui.js';

// ToDo: Run on main thread until https://crbug.com/1195763 gets resolved.
// const preProcessWorker = new Worker('preprocessworker.js', { type: 'module' });

const posterizeCheckbox = document.querySelector('.posterize');
const canvasMain = document.querySelector('.canvas-main');
const ctxMain = canvasMain.getContext('2d');
ctxMain.imageSmoothingEnabled = false;

const preProcessMainCanvas = () => {
  const { width, height } = getScaledDimensions();
  canvasMain.width = width;
  canvasMain.height = height;
  ctxMain.clearRect(0, 0, width, height);
  ctxMain.filter = getFilterString();
  ctxMain.drawImage(
    inputImage,
    0,
    0,
    inputImage.naturalWidth,
    inputImage.naturalHeight,
    0,
    0,
    width,
    height,
  );
  return ctxMain.getImageData(0, 0, width, height);
};

// ToDo: Run on main thread until https://crbug.com/1195763 gets resolved.
/*
const preProcessInputImage = async () => {
  return new Promise(async (resolve, reject) => {
    preProcessWorker.onmessage = (e) => {
      resolve(e.data);
    };
    const { width, height } = getScaledDimensions();
    const imageBitmap = await createImageBitmap(inputImage);
    preProcessWorker.postMessage([
      imageBitmap,
      getFilterString(),
      width,
      height,
    ]);
  });
};
*/

const getScaledDimensions = () => {
  const scaleFactor = parseInt(filterInputs[SCALE.scale].value, 10) / 100;
  return {
    width: Math.ceil(inputImage.naturalWidth * scaleFactor),
    height: Math.ceil(inputImage.naturalHeight * scaleFactor),
  };
};

const getPosterizeFilter = () => {
  const getRange = (input) => {
    const value = parseInt(input.value, 10);
    const array = [];
    for (let i = 0; i <= value; i++) {
      array[i] = ((1 / value) * i).toFixed(1);
    }
    return array.join(',');
  };

  return `data:image/svg+xml;utf8,<svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <filter id="posterize">
        <feComponentTransfer>
          <feFuncR type="discrete" tableValues="${getRange(
            filterInputs[COLORS.red],
          )}" />
          <feFuncG type="discrete" tableValues="${getRange(
            filterInputs[COLORS.green],
          )}" />
          <feFuncB type="discrete" tableValues="${getRange(
            filterInputs[COLORS.blue],
          )}" />
          <feFuncA type="discrete" tableValues="${getRange(
            filterInputs[COLORS.alpha],
          )}" />
        </feComponentTransfer>
      </filter>
    </svg>`
    .replace(/[\r\n]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getFilterString = () => {
  let string = `${
    posterizeCheckbox.checked ? `url('${getPosterizeFilter()}#posterize') ` : ''
  }`;
  for (const [filter, props] of Object.entries(filters)) {
    const input = filterInputs[filter];
    if (props.initial === parseInt(input.value, 10)) {
      continue;
    }
    string += `${filter}(${input.value}${input.dataset.unit}) `;
  }
  return string.trim() || 'none';
};

export { preProcessMainCanvas, canvasMain };
