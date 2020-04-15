import React, {useCallback, useState} from 'react'
import './App.css';
import './toggle.css';

import {useDropzone} from 'react-dropzone'
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver'

const f = (files: any[], addPdf: (pdf: Pdf) => void) => {
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = () => {
      const res: any = reader.result as any
      addPdf({
        name: file.name,
        file: res
      })
    }
  
    reader.onabort = () => console.error("Reader aborted!")
    reader.onerror = () => console.error("Reader error!")
    reader.readAsArrayBuffer(file)
  
  })
}

const MyDropzone = (props: { addPdf: (pdf: Pdf) => void }) => {
  const onDrop = useCallback(acceptedFiles => {
    // Do something with the files
    f(acceptedFiles, props.addPdf)
  }, [])
  
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

  return (
    <div style={{
      border: '10px solid black',
      width: '800px',
      height: '400px',
      fontSize: '32px',
      fontWeight: 700,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderStyle: 'dashed',
      marginBottom: '50px'
    }} {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Yes!</p> :
          <p>Drag and drop your pdfs here!</p>
      }
    </div>
  )
}

const mergePdfs = async (state: State) => {
  let pdfDoc = await PDFDocument.create();
  let i = 0;
  while (i < state.pdfs.length) {
    const currentPdf = await PDFDocument.load(state.pdfs[i].file)
    
    const totalPages = currentPdf.getPageCount()
    const pages: number[] = []
    let j = 0;
    while (j < totalPages) {
      pages.push(j)
      j += 1
    }
    const copiedPages = await pdfDoc.copyPages(currentPdf, pages)
    copiedPages.forEach(page => {
      pdfDoc.addPage(page)
    })

    i = i + 1
  }

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  if (state.pageNumbering) {
    const pages = pdfDoc.getPages()
    let pageCount = 1
    pages.forEach(page => {
      const { width, height } = page.getSize()
      page.drawText(pageCount.toString(), {
        x: width - state.xOffset,
        y: height - state.yOffset,
        size: state.fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0)
      })

      pageCount++
    })
  }
  const pdfBytes = await pdfDoc.save()
  saveAs(new Blob([pdfBytes],{type:"application/octet-stream"}), "merged.pdf")  
}


type State = {
  pdfs: Pdf[]
  fontSize: number
  xOffset: number
  yOffset: number
  pageNumbering: boolean
}
type Pdf = {
  file: any
  name: string
}
const defaultState = { pdfs: [], fontSize: 12, xOffset: 20, yOffset: 20, pageNumbering: false }
function App() {
  const [state, setState] = useState<State>(defaultState)
  const addPdf = (pdf: Pdf) => setState(prevState => ({...prevState,pdfs: [...prevState.pdfs, pdf] }))
  return (
    <div className="App">
      <h1 style={{ 
        marginTop: '50px',
        fontSize: '43px'
    
      }}>Merge your PDFs</h1>
      <div
        style={{
          textAlign: 'center',
          fontSize: '32px',
          maxWidth: '800px'
        }}
      >
      <p>
        Hey you! If you want to combine several PDFs into one you came to the right place.
      </p>
      <p>
        Just drag and drop your PDFs into the box below and press merge.
      </p>
      </div>
      {state.pdfs.length > 0 ?
      (<div
        style={{
          width: '800px',
          backgroundColor: 'white',
          marginTop: '50px',
          marginBottom: '50px',
          fontSize: '32px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <ul style={{
          marginBottom: '100px'
        }}>
          {state.pdfs.map((pdf, k) => {
            return (<li key={k}>{pdf.name}</li>)
          })}
        </ul>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100px'
          }}
        >
        <div className="toggle"
          onClick={() => {
            setState(prevState => ({...prevState, pageNumbering: !prevState.pageNumbering}))
          }}
        >
          <input type="checkbox" className="check" />
          <b className="b switch"></b>
          <b className="b track"></b>
        </div>
        <p style={{ 
          color: 'grey',
          position: 'absolute',
          top: '-20%',
          left: '15%'
        }}>Set page numbers</p>
        </div>
        {state.pageNumbering ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '32px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginLeft: '100px'
              }}
            >
              <span>Font Size: </span> 
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '10px',
                  fontSize: '32px',
                  width: '100px',
                  borderRadius: '4px'
                }}
                type='number'
                value={state.fontSize}
                onChange={(e) => {
                  const val = e.target.value
                  setState(prevState => ({...prevState, fontSize: Number(val) }))
                }} 
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginLeft: '100px',
                marginTop: '10px'
              }}
            >
              <span>x-offset: </span> 
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '30px',
                  fontSize: '32px',
                  width: '100px',
                  borderRadius: '4px'
                }}
                type='number'
                value={state.xOffset}
                onChange={(e) => {
                  const val = e.target.value
                  setState(prevState => ({...prevState, xOffset: Number(val) }))
                }} 
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginLeft: '100px',
                marginTop: '10px'
              }}
            >
              <span>y-offset: </span> 
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '30px',
                  fontSize: '32px',
                  width: '100px',
                  borderRadius: '4px'
                }}
                type='number'
                value={state.yOffset}
                onChange={(e) => {
                  const val = e.target.value
                  setState(prevState => ({...prevState, yOffset: Number(val) }))
                }} 
              />
            </div>
          </div>
        ) : null}
        <div
          style={{
            marginTop: '50px',
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              color: '#fff',
              backgroundColor: '#28a745',
              backgroundImage: 'linear-gradient(-180deg,#34d058,#28a745)',
              width: '150px',
              height: '50px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => {
              mergePdfs(state)
              // setState(defaultState)
            }}
          >
            Merge
          </div>
          <div
            style={{
              color: '#fff',
              backgroundColor: 'rgb(167, 40, 40)',
              backgroundImage: 'linear-gradient(-180deg, rgb(208, 52, 52), rgb(167, 40, 40))',
              width: '150px',
              height: '50px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => {
              setState(defaultState)
            }}
          >
            Clear
          </div>
        </div>
      </div>) : null
      }
      <MyDropzone addPdf={addPdf} />
    </div>
  );
}

export default App;
