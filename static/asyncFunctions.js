const DEFAULT_TIMEOUT = 2000;
const LOAD_ERROR_MESSAGE = 'Failed to load!';

const createTimeoutPromise = (errorMessage = '') => {
  let resolveCallback;
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(errorMessage);
    }, DEFAULT_TIMEOUT);
    resolveCallback = resolve;
  });
  return { promise, resolveCallback };
};

const createDataLoadPromise = data => {
  const { promise, resolveCallback } = createTimeoutPromise(LOAD_ERROR_MESSAGE);
  data.onload = resolveCallback;
  return promise;
};

const imageLoader = listener => {
  const promises = [];

  const loadImage = src => {
    const image = new Image();
    image.src = src;

    const promise = createDataLoadPromise(image);

    if (listener) {
      promise.then(listener);
    }
    promises.push(promise);
    return image;
  };

  return { loadImage, promises };
};

const loadImages = (destination, paths, listener) => {
  const loader = imageLoader(listener);

  for (const path of paths) {
    const image = loader.loadImage(path);
    destination.push(image);
  }

  return loader.promises;
};

export { createTimeoutPromise, imageLoader, createDataLoadPromise, loadImages };
