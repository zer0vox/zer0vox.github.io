import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import FibonacciPsyBackground from '../components/FibonacciPsyBackground'
import './Pzcel.css'

const PASS_KEY = '7922'
const ADDIN_PATH = '/pzcel-addin/index.html'

// Build the Office Add-in manifest pointed at whatever host the site is served
// from, so the downloaded file always matches the live deployment (prod, a
// preview URL, or localhost) — no hardcoded domain to drift out of sync.
function buildManifest(origin) {
  const taskpaneUrl = `${origin}${ADDIN_PATH}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp
          xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
          xmlns:ov="http://schemas.microsoft.com/office/taskpaneappversionoverrides"
          xsi:type="TaskPaneApp">

  <!-- Basic Settings -->
  <Id>b4e2cb5a-cd93-47e2-a0e2-2a5b281f6c49</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>pzcel</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="pzcel AI" />
  <Description DefaultValue="AI Assistant for Excel Data Manipulation"/>

  <IconUrl DefaultValue="https://raw.githubusercontent.com/OfficeDev/office-ui-fabric-core/master/src/components/Icon/icons/ExcelLogo_32x32.png" />
  <HighResolutionIconUrl DefaultValue="https://raw.githubusercontent.com/OfficeDev/office-ui-fabric-core/master/src/components/Icon/icons/ExcelLogo_80x80.png"/>

  <!-- Permissions -->
  <SupportUrl DefaultValue="${taskpaneUrl}"/>
  <AppDomains>
    <AppDomain>${origin}</AppDomain>
  </AppDomains>

  <Hosts>
    <Host Name="Workbook" />
  </Hosts>

  <DefaultSettings>
    <SourceLocation DefaultValue="${taskpaneUrl}" />
  </DefaultSettings>

  <Permissions>ReadWriteDocument</Permissions>

  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
      <Host xsi:type="Workbook">
        <DesktopFormFactor>
          <ExtensionPoint xsi:type="PrimaryCommandSurface">
            <OfficeTab id="TabHome">
              <Group id="pzcel.Group1">
                <Label resid="pzcel.GroupLabel" />
                <Icon>
                  <bt:Image size="16" resid="pzcel.Icon" />
                  <bt:Image size="32" resid="pzcel.Icon" />
                  <bt:Image size="80" resid="pzcel.Icon" />
                </Icon>
                <Control xsi:type="Button" id="pzcel.TaskpaneButton">
                  <Label resid="pzcel.TaskpaneButton.Label" />
                  <Supertip>
                    <Title resid="pzcel.TaskpaneButton.Label" />
                    <Description resid="pzcel.TaskpaneButton.Tooltip" />
                  </Supertip>
                  <Icon>
                    <bt:Image size="16" resid="pzcel.Icon" />
                    <bt:Image size="32" resid="pzcel.Icon" />
                    <bt:Image size="80" resid="pzcel.Icon" />
                  </Icon>
                  <Action xsi:type="ShowTaskpane">
                    <TaskpaneId>ButtonId1</TaskpaneId>
                    <SourceLocation resid="pzcel.Taskpane.Url" />
                  </Action>
                </Control>
              </Group>
            </OfficeTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
    </Hosts>

    <Resources>
      <bt:Images>
        <bt:Image id="pzcel.Icon" DefaultValue="https://raw.githubusercontent.com/OfficeDev/office-ui-fabric-core/master/src/components/Icon/icons/ExcelLogo_32x32.png" />
      </bt:Images>
      <bt:Urls>
        <bt:Url id="pzcel.Taskpane.Url" DefaultValue="${taskpaneUrl}" />
      </bt:Urls>
      <bt:ShortStrings>
        <bt:String id="pzcel.GroupLabel" DefaultValue="pzcel AI" />
        <bt:String id="pzcel.TaskpaneButton.Label" DefaultValue="Open pzcel" />
      </bt:ShortStrings>
      <bt:LongStrings>
        <bt:String id="pzcel.TaskpaneButton.Tooltip" DefaultValue="Open the pzcel AI sidebar." />
      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
`
}

const INSTALL_STEPS = [
  'Open Excel — on the web (excel.office.com) or desktop.',
  'Go to the Insert tab → Add-ins → “Upload My Add-in”.',
  'Choose the manifest.xml file you download below.',
  'The “Open pzcel” button appears on the Home tab — click it to launch the sidebar.',
]

export default function Pzcel() {
  const [unlocked, setUnlocked] = useState(false)
  const [value, setValue]       = useState('')
  const [error, setError]       = useState(false)
  const inputRef = useRef(null)

  const attempt = useCallback((e) => {
    e.preventDefault()
    if (value.trim() === PASS_KEY) {
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setValue('')
      inputRef.current?.focus()
    }
  }, [value])

  const downloadManifest = useCallback(() => {
    const origin = window.location.origin
    const blob = new Blob([buildManifest(origin)], { type: 'text/xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'manifest.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  return (
    <>
      <FibonacciPsyBackground />

      <nav className="top" id="nav">
        <div className="inner">
          <a href="#top" className="brand">greenhueblues<span className="reg">®</span></a>
          <ul>
            <li><a href="#work">Work</a></li>
            <li><a href="#index">Index</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#playground">Playground</a></li>
            <li><a href="#leaders">Leaders</a></li>
            <li><a href="#pzcel" className="active" aria-current="page">PZCEL</a></li>
          </ul>
          <div className="right">
            <a href="#">X</a>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      <main className="pzcel wrap" id="top">
        <motion.header
          className="pzcel-hero"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <span className="pzcel-label">01 / Excel Add-in</span>
          <h1 className="pzcel-title">PZCEL <span className="pzcel-ver">v0</span></h1>
          <p className="pzcel-lead">
            An AI assistant that lives inside Excel — find duplicates, summarise
            selections, format currency, and run prompts against your data.
            Access is restricted; enter the key to retrieve the install manifest.
          </p>
        </motion.header>

        <motion.section
          className="pzcel-panel"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div className="pzcel-panel-head">
            <span className={`pzcel-status ${unlocked ? 'on' : ''}`} />
            <span className="pzcel-status-label">
              {unlocked ? 'Access granted' : 'Access restricted'}
            </span>
          </div>

          {!unlocked ? (
            <form className="pzcel-gate" onSubmit={attempt}>
              <label htmlFor="pzcelKey" className="pzcel-field-label">
                Access key
              </label>
              <div className="pzcel-field">
                <input
                  id="pzcelKey"
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="••••"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError(false) }}
                />
                <button type="submit" className="pzcel-btn solid">Unlock</button>
              </div>
              {error && (
                <p className="pzcel-error">Invalid key — please try again.</p>
              )}
            </form>
          ) : (
            <div className="pzcel-content">
              <div className="pzcel-block">
                <span className="pzcel-block-no">A</span>
                <div className="pzcel-block-body">
                  <h2>Install in Excel</h2>
                  <ol className="pzcel-steps">
                    {INSTALL_STEPS.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="pzcel-block">
                <span className="pzcel-block-no">B</span>
                <div className="pzcel-block-body">
                  <h2>Get the manifest</h2>
                  <p className="pzcel-note">
                    Generated for this host —{' '}
                    <code>{window.location.origin}{ADDIN_PATH}</code> — so it
                    works the moment you upload it.
                  </p>
                  <div className="pzcel-actions">
                    <button className="pzcel-btn solid" onClick={downloadManifest}>
                      Download manifest.xml
                    </button>
                    <a
                      className="pzcel-btn"
                      href={ADDIN_PATH}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview task pane ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </main>

      <footer className="pzcel-footer">
        <div className="pzcel-footer-inner">
          <a href="#top" className="pzcel-footer-brand">
            greenhueblues<span className="reg">®</span>
          </a>
          <span className="pzcel-footer-copy">Copyright 2026. All rights reserved.</span>
        </div>
      </footer>
    </>
  )
}
