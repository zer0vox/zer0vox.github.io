import { useState, useRef, useCallback } from 'react'
import './AuthorizedSection.css'

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
  'Go to the Insert tab → Add-ins → "Upload My Add-in".',
  'Choose the manifest.xml file you downloaded below.',
  'The "Open pzcel" button appears on the Home tab. Click it to launch the sidebar.',
]

export default function AuthorizedSection() {
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
    <section id="authorized" className="auth-section wrap">
      <div className="auth-head">
        <h2>_authorized<span className="auth-blink">_</span></h2>
        <p className="auth-sub">
          Restricted distribution. Enter the access key to retrieve the{' '}
          <code>pzcel AI</code> Excel add-in and its install manifest.
        </p>
      </div>

      <div className="auth-panel">
        <div className="auth-bar">
          <span className={`auth-led ${unlocked ? 'on' : ''}`} />
          <span className="auth-bar-label">
            {unlocked ? 'access · granted' : 'access · locked'}
          </span>
        </div>

        {!unlocked ? (
          <form className="auth-gate" onSubmit={attempt}>
            <label htmlFor="authKey" className="auth-label">
              &gt; enter access key
            </label>
            <div className="auth-input-row">
              <span className="auth-prompt">$</span>
              <input
                id="authKey"
                ref={inputRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                className="auth-input"
                placeholder="••••"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(false) }}
              />
              <button type="submit" className="auth-submit">unlock</button>
            </div>
            {error && (
              <p className="auth-error">✗ access denied — invalid key. try again.</p>
            )}
          </form>
        ) : (
          <div className="auth-content">
            <p className="auth-granted">
              ✓ Key accepted. pzcel AI add-in unlocked.
            </p>

            <div className="auth-block">
              <h3>1 · Install in Excel</h3>
              <ol className="auth-steps">
                {INSTALL_STEPS.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="auth-block">
              <h3>2 · Get the manifest</h3>
              <p className="auth-note">
                The manifest is generated for this host —{' '}
                <code>{window.location.origin}{ADDIN_PATH}</code> — so it works
                the moment you upload it.
              </p>
              <div className="auth-actions">
                <button className="auth-btn primary" onClick={downloadManifest}>
                  ↓ Download manifest.xml
                </button>
                <a
                  className="auth-btn"
                  href={ADDIN_PATH}
                  target="_blank"
                  rel="noreferrer"
                >
                  ↗ Preview the task pane
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
