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
    // @ts-ignore
    mixpanel.track("File dropped");

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
    // @ts-ignore
    mixpanel.track("Page numbering set");
    
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
  
  // @ts-ignore
  mixpanel.track("Pdf merged");

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
  // @ts-ignore
  mixpanel.track("Page loaded");
  
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
          marginBottom: '50px',
          fontSize: '32px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '60px',
              height: '40px'
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
          </div>
          <p
            style={{
              fontSize: '32px',
              marginLeft: '10px',
              color: state.pageNumbering ? 'black' : 'grey'
            }}
          >Page numbers</p>
        </div>
        {state.pageNumbering ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '32px',
              marginBottom: '50px'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginLeft: '70px'
              }}
            >
              <span>Font Size: </span> 
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '10px',
                  fontSize: '32px',
                  width: '150px',
                  borderRadius: '4px'
                }}
                type='range'
                min="0"
                max="150"
                step="1"
                value={state.fontSize}
                onChange={(e) => {
                  const val = e.target.value
                  setState(prevState => ({...prevState, fontSize: Number(val) }))
                }} 
              />
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '10px',
                  fontSize: '32px',
                  width: '70px',
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
                marginLeft: '70px',
                marginTop: '10px'
              }}
            >
              <span>x-offset: </span> 
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '24px',
                  fontSize: '32px',
                  width: '150px',
                  borderRadius: '4px'
                }}
                type='range'
                min="0"
                max="150"
                step="1"
                value={state.xOffset}
                onChange={(e) => {
                  const val = e.target.value
                  setState(prevState => ({...prevState, xOffset: Number(val) }))
                }} 
              />
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '10px',
                  fontSize: '32px',
                  width: '70px',
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
                marginLeft: '70px',
                marginTop: '10px'
              }}
            >
              <span>y-offset: </span> 
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '24px',
                  fontSize: '32px',
                  width: '150px',
                  borderRadius: '4px'
                }}
                type='range'
                min="0"
                max="150"
                step="1"
                value={state.yOffset}
                onChange={(e) => {
                  const val = e.target.value
                  setState(prevState => ({...prevState, yOffset: Number(val) }))
                }} 
              />
              <input 
                style={{ 
                  height: '40px',
                  marginLeft: '10px',
                  fontSize: '32px',
                  width: '70px',
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
            display: 'flex',
            justifyContent: 'space-between',
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
              cursor: 'pointer',
              border: '1px solid rgba(27,31,35,.2)'
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
              cursor: 'pointer',
              border: '1px solid rgba(27,31,35,.2)'
            }}
            onClick={() => {
              setState(defaultState)
            }}
          >
            Clear
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '50px',
            marginBottom: '50px'
          }}
        >
          <ul style={{
          }}>
            {state.pdfs.map((pdf, k) => {
              return (<li key={k}>{pdf.name}</li>)
            })}
          </ul>
        </div>
      </div>) : null
      }
      <MyDropzone addPdf={addPdf} />
    </div>
  );
}

export default App;
