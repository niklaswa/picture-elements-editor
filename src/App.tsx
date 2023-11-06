import {useState, useEffect} from 'react'
import './App.css'
import YAML from 'yaml'

function App() {
    const [homeAssistantHost, setHomeAssistantHost] = useState<string>('');
    const [config, setConfig] = useState<PictureElementsCard | undefined>();

    const [image, setImage] = useState<string>('');
    const [configError, setConfigError] = useState<string>('');

    const [selectedElement, setSelectedElement] = useState<PictureElement | null>(null);
    const [initialMousePosition, setInitialMousePosition] = useState<{ x: number; y: number } | null>(null);
    const [initialElementPosition, setInitialElementPosition] = useState<{ top: number; left: number } | null>(null);

    const parseConfig = (config: string) => {
        try {
            const parsedConfig = YAML.parse(config) as PictureElementsCard;
            if (!parsedConfig) {
                setConfigError('');
                return;
            }
            if (typeof parsedConfig !== 'object') {
                throw new Error('Invalid configuration: must be an object.');
            }
            // Make sure 'type' is set to 'picture-elements'
            if (parsedConfig.type === 'picture-elements') {
                setConfig(parsedConfig);
            } else {
                throw new Error('Invalid configuration: "type" must be "picture-elements".');
            }
        } catch (e: any) {
            console.error(e);
            setConfigError(e.message || 'Unknown error');
        }
    }

    useEffect(() => {
        // Load config from local storage if it exists
        const config = localStorage.getItem('config');
        if (config) {
            parseConfig(config);
        }

        // Load home assistant host from local storage if it exists
        const host = localStorage.getItem('homeAssistantHost');
        if (host) {
            setHomeAssistantHost(host);
        }
    }, []);

    useEffect(() => {
        // Save config to local storage
        if (config) {
            localStorage.setItem('config', YAML.stringify(config));
        }

        if (!image && config) {
            setImage(homeAssistantHost + config.image);
        }
    }, [config, homeAssistantHost, image]);

    useEffect(() => {
        // Save home assistant host to local storage
        localStorage.setItem('homeAssistantHost', homeAssistantHost);
        if (config) {
            setImage(homeAssistantHost + config.image);
        }
    }, [config, homeAssistantHost]);

    const handleMouseDown = (element: PictureElement, e: React.MouseEvent) => {
        e.preventDefault();
        console.debug('handleMouseDown', element, e)
        if (!element.style) {
            element.style = {};
        }
        setSelectedElement(element);
        setInitialMousePosition({ x: e.clientX, y: e.clientY });
        setInitialElementPosition({
            top: parseInt(element.style.top || '0'),
            left: parseInt(element.style.left || '0'),
        });
    }

    const handleMouseUp = () => {
        console.debug('handleMouseUp')
        setSelectedElement(null);
        setInitialMousePosition(null);
        setInitialElementPosition(null);
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        console.debug('handleMouseMove', selectedElement, initialMousePosition, initialElementPosition);
        if (selectedElement && initialMousePosition && initialElementPosition) {
            // Calculate new %  position with 2 decimal places within .editor element
            const editorElement = document.querySelector('.editor');
            if (!editorElement) {
                return;
            }

            const editorRect = editorElement.getBoundingClientRect();
            const percentLeft = Math.round((e.clientX - editorRect.left) / editorRect.width * 10000) / 100;
            const percentTop = Math.round((e.clientY - editorRect.top) / editorRect.height * 10000) / 100;

            // Update element style
            if (!selectedElement.style) {
                selectedElement.style = {};
            }
            selectedElement.style.left = percentLeft + '%';
            selectedElement.style.top = percentTop + '%';

            // Update config
            setConfig({...config!});
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const translateStyle = (style: Style | undefined) => {
        // Translate style properties to react CSS properties
        const cssStyle = style ? {...style} : {};
        if (style) {
            if (style['border-radius']) {
                cssStyle['borderRadius'] = style['border-radius'];
                delete cssStyle['border-radius'];
            }
            if (style['background-color']) {
                cssStyle['backgroundColor'] = style['background-color'];
                delete cssStyle['background-color'];
            }
        }
        return cssStyle;
    };

    const renderElement = (element: PictureElement) => {
        switch (element.type) {
            case 'icon':
            case 'state-icon':
                if (element.icon && element.icon.startsWith('mdi:')) {
                    return <img className="icon" src={"/assets/mdi/" + element.icon.replace('mdi:', '') + ".svg"} alt=""/>
                }
                break;
            case 'image':
                if (element.image) {
                    return <img src={homeAssistantHost + element.image} alt=""/>
                }
                break;
        }

        return element.type;
    };

    return (
        <>
            <h1>Picture Elements Card Editor</h1>
            <div className="columns" style={{display: 'flex'}}>
                <div className="column" style={{flex: 1}}>
                    <h2>Configuration</h2>

                    <input type={'text'} placeholder={'Home Assistant Host (optional to load image)'} value={homeAssistantHost}
                            onChange={(e) => setHomeAssistantHost(e.target.value)}/>
                    <br/>
                    <div className="drag-drop" onDragOver={handleDragOver} onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = e.dataTransfer.files;
                        if (files.length === 0 || files[0].type.indexOf('image') === -1) {
                            return;
                        }
                        const url = URL.createObjectURL(files[0]);
                        setImage(url);
                    }}>
                        <p>Drop Image here to overwrite current image</p>
                    </div>
                    <textarea
                        spellCheck={false}
                        placeholder={'Paste your picture-elements card yaml configuration here'}
                        style={{border: configError ? '1px solid red' : '1px solid #ccc'}}
                        onChange={(e) => {
                            parseConfig(e.currentTarget.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 's' && e.ctrlKey || e.key === 's' && e.metaKey) {
                                e.preventDefault();
                                parseConfig(e.currentTarget.value);
                            }
                        }}
                        value={config ? YAML.stringify(config) : ''}
                    >
                    </textarea>
                    {configError && <p style={{color: 'red'}}>{configError}</p>}
                </div>
                <div className="column" style={{flex: 2}}>
                    <h2>Preview</h2>

                    <div className="editor">
                        <img className="picture" src={image} alt="" draggable={false}/>
                        <div className="elements">
                            {config?.elements.map((element, index) => (
                                <div
                                    className="element"
                                    style={translateStyle(element.style)}
                                    key={index}
                                    data-type={element.type}
                                    onMouseDown={(e) => handleMouseDown(element, e)}
                                    onMouseUp={handleMouseUp}
                                    onMouseMove={handleMouseMove}
                                >
                                    {renderElement(element)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;
