
const setLine = (line, newText) => {
  line.innerHTML = `<p>${newText}</p>`;
};

const setLoadingLine = (line, progress) => {
  line.innerHTML = `<p>Loading server data... ${progress * 100}%</p>`;
};

const writeLine = (parent, text = '') => {
  const line = document.createElement('div');
  setLine(line, text);
  parent.appendChild(line);
  return line;
};

const createLoadingLog = (logElement, dataCount) => {
  let counter = 0;
  const line = writeLine(logElement);
  setLoadingLine(line, 0);

  const onDataLoad = () => {
    counter++;
    setLoadingLine(line, counter / dataCount);
  };
  return { line, onDataLoad };
};

export { writeLine, setLoadingLine, setLine, createLoadingLog };
