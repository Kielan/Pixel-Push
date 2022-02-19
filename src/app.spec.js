/**
 * @jest-environment jsdom
 */

import App from './App.svelte'
import { render, fireEvent } from '@testing-library/svelte'
//import { fillInFile } from 'fill-in-file'
import { toggleMode, switchMode } from './EditorState'
import Events from './Events'
import testGIF from '../public/test-image-url.gif'
import fetch from 'node-fetch'

/* jest requires that you mock the fetch function */

function fetchBlobImage() {
//  const responseToBlob = require('../public/test-image-url.gif')
//    .then(response => response.blob)
//    .then(blob => processImage(blob));
  return testGIF;
}

function processImage(blob) {
  return JSON.stringify(blob);
}

jest.mock('node-fetch', () => {
  const context = {
    then: jest.fn().mockImplementationOnce(() => {
      const blob = {};
      const response = { blob };
      return Promise.resolve(response);
    })
  };
  return jest.fn(() => context);
});

beforeEach(() => {
  global.document = {
    getElementById: jest.fn()
  }
});

afterEach(() => {
  jest.resetModules()
  jest.clearAllMocks()
  delete global.document;
});

it('App opens and renders', async () => {
  const { getByText, getByTestId } = render(App)
  expect(getByText('Load')).toBeInTheDocument()
})

it('Test mock test suite', async () => {

})

it('App uploads file and changes state', async () => {
  const dt = () => new DataTransfer() || new ClipboardEvent('').clipboardData;

  const { getByText, getByTestId } = render(App)

  //mock fetch returns res.blob()
  let blob = await fetchBlobImage();

  let file = new File([blob], "sample.jpg", { type: 'image/gif'})

  let dtInstance = dt();
  dtInstance.items.add(file);

  let $fileElement = document.getElementById('open-image-browse-holder');
  $fileElement.files = dtInstance.files;

  let changeEvent = new Event('change');
  $fileElement.dispatchEvent(changeEvent);

  await fillInFile('#open-image-browse-holder'); //✅ app state should change triggerd by...

  expect($fileElement).toHaveTextContent('test sample image name')
})

it('App uploads file and changes state', async () => {
  const dt = () => new DataTransfer() || new ClipboardEvent('').clipboardData;

  //mock fetch returns res.blob()
  let blob = await fetchBlobImage();

  let file = new File([blob], "sample.jpg", { type: 'image/gif'})

  let dtInstance = dt();
  dtInstance.items.add(file);

  let $fileElement = document.getElementById('open-image-browse-holder');
  $fileElement.files = dtInstance.files;

  let changeEvent = new Event('change');
  $fileElement.dispatchEvent(changeEvent);

  await fillInFile('#open-image-browse-holder'); //✅ app state should change triggerd by...

  expect($fileElement).toExist();//toHaveTextContent('test sample image name')
})

it('should call input clicked to have been called ', async () => {

  //mock fetch returns res.blob()
  let blob = await fetchBlobImage();

  let file = new File([blob], "sample.gif", { type: 'image/gif'})

  //✅ app state should change triggered by...
  fireEvent.drop(document.getElementById('#open-image-browse-holder'), {
    dataTransfer: {
      files: [file],
    },
  })
  
  expect($fileElement).toHaveTextContent('sample.gif')
})

it('should call Event handled function toggleMode() ', async () => {
  //mock fetch returns res.blob()
  let blob = await fetchBlobImage();

  let file = new File([blob], "sample.gif", { type: 'image/gif'})

  //✅ app state should change triggered by...
  fireEvent.drop(document.getElementById('#open-image-browse-holder'), {
    dataTransfer: {
      files: [file],
    },
  })

  expect(toggleMode).toHaveBeenCalled()
})

// it('should call Event handled function switchMode() ', () => {
//   expect(switchMode).toHaveBeenCalled()
// })