import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import "../styles/ResponseBox.css";

const CARD_CODES = ["CI", "CII", "CIII", "CIV", "CV", "CVI", "CVII", "CVIII", "CIX", "CX"];
const ORIENTATION_OPTIONS = ["Up", "Right", "Down", "Left", "@"];

function OrientationIcon({ option }) {
    if (option === "@") {
        return <span className="orientation__glyph">@</span>;
    }

    const rotationMap = {
        Up: "rotate(0deg)",
        Right: "rotate(90deg)",
        Down: "rotate(180deg)",
        Left: "rotate(-90deg)",
    };

    return (
        <svg
            className="orientation__svg"
            xmlns="http://www.w3.org/2000/svg"
            width="30.435"
            height="22.722"
            viewBox="0 0 30.435 22.722"
            aria-hidden="true"
            style={{ transform: rotationMap[option] }}
        >
            <g transform="translate(0 22.722) rotate(-90)">
                <rect width="14" height="11.435" transform="translate(0 9.5)" fill="black" />
                <path
                    d="M13.979.977a2,2,0,0,1,2.477,0L25.907,8.43A2,2,0,0,1,24.669,12H5.766A2,2,0,0,1,4.528,8.43Z"
                    transform="translate(22.722) rotate(90)"
                    fill="black"
                />
            </g>
        </svg>
    );
}

function NotesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20.846" height="20.846" viewBox="0 0 20.846 20.846" aria-hidden="true">
            <path d="M14.518,15.651h6.328V3.367A1.114,1.114,0,0,0,19.729,2.25H1.117A1.114,1.114,0,0,0,0,3.367V21.979A1.114,1.114,0,0,0,1.117,23.1H13.4V16.768A1.12,1.12,0,0,1,14.518,15.651Zm6,2.559-4.56,4.56a1.116,1.116,0,0,1-.791.326H14.89V17.14h5.956v.284A1.113,1.113,0,0,1,20.52,18.21Z" transform="translate(0 -2.25)" />
        </svg>
    );
}

function OrientationPanelIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24.189" height="24.303" viewBox="0 0 24.189 24.303" aria-hidden="true">
            <path d="M8.7,7.6,1.29,15.031l7.426,7.415,7.426-7.415L8.7,7.6ZM4.528,15.031l4.188-4.188,4.176,4.188L8.7,19.219,4.528,15.031Zm17.93-7.163a10.24,10.24,0,0,0-7.277-3.021V1.14L10.329,5.992l4.852,4.852V7.136a8.01,8.01,0,1,1-3.25,15.321l-1.7,1.7A10.29,10.29,0,0,0,22.458,7.868Z" transform="translate(-1.29 -1.14)" />
        </svg>
    );
}

function TouchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18.974" height="26.564" viewBox="0 0 18.974 26.564" aria-hidden="true">
            <path d="M12.5,14.923V10.192a3.162,3.162,0,0,1,6.325,0v4.731a5.692,5.692,0,1,0-6.325,0ZM24.948,20.78l-5.743-2.859a1.781,1.781,0,0,0-.683-.139h-.961v-7.59a1.9,1.9,0,1,0-3.795,0V23.778l-4.339-.911a2.211,2.211,0,0,0-.3-.038,1.415,1.415,0,0,0-1,.417l-1,1.012,6.249,6.249a1.9,1.9,0,0,0,1.341.557H23.3a1.842,1.842,0,0,0,1.822-1.619l.949-6.666a1.818,1.818,0,0,0-1.126-2Z" transform="translate(-7.125 -4.5)" />
        </svg>
    );
}

const ResponseBox = forwardRef(function ResponseBox(
    {
        cardIndex,
        responseNumber,
        globalResponseNumber,
        topPercent,
        isInitiallyOpen = false,
        shouldScrollIntoView = false,
    },
    ref
) {
    const [isOpen, setIsOpen] = useState(isInitiallyOpen);
    const [notesOpen, setNotesOpen] = useState(false);
    const [orientationOpen, setOrientationOpen] = useState(false);
    const [touchActive, setTouchActive] = useState(false);
    const [orientation, setOrientation] = useState("Up");
    const [responseText, setResponseText] = useState("");
    const [notesText, setNotesText] = useState("");
    const [isROptimized, setIsROptimized] = useState(false);
    const wrapperRef = useRef(null);

    const cardCode = CARD_CODES[cardIndex] ?? `C${cardIndex + 1}`;
    const responseId = `${cardCode}R${responseNumber}`;
    const showROptimized = responseNumber === 1 || responseNumber === 4;

    const rOptimizedConfig =
        responseNumber === 1
            ? { shortLabel: "Pr", fullLabel: "Prompt" }
            : { shortLabel: "Pu", fullLabel: "Pull" };

    useImperativeHandle(
        ref,
        () => ({
            getResponseData: () => ({
                cardIndex,
                cardCode,
                responseNumber,
                globalResponseNumber,
                responseId,
                responseText,
                notesText,
                orientation,
                touchActive,
                isROptimized: showROptimized ? isROptimized : false,
            }),
        }),
        [
            cardIndex,
            cardCode,
            responseNumber,
            globalResponseNumber,
            responseId,
            responseText,
            notesText,
            orientation,
            touchActive,
            isROptimized,
            showROptimized,
        ]
    );

    useEffect(() => {
        if (!shouldScrollIntoView || !wrapperRef.current) return;
        wrapperRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [shouldScrollIntoView]);

    const handleOpen = () => {
        setIsOpen(true);
    };

    return (
        <div
            ref={wrapperRef}
            className="response-box-wrapper"
            style={{ top: `${topPercent}%` }}
            id={`${responseId}-wrapper`}
        >
            {showROptimized && (
                <ul
                    className={`r__optimized__container ${isOpen ? "r__optimized__container--open" : ""}`}
                    id={`r_opt_prompt_${responseId.toLowerCase()}`}
                >
                    <button
                        className={`r__optimized__button ${isROptimized ? "r__optimized__button__active" : ""}`}
                        type="button"
                        value={rOptimizedConfig.fullLabel}
                        onClick={() => setIsROptimized((prev) => !prev)}
                    >
                        <input
                            id={`${responseId}_rOptimized`}
                            type="hidden"
                            name={`${responseId}_rOptimized`}
                            value={String(isROptimized)}
                        />
                        <span className="vertically_align_text">{rOptimizedConfig.shortLabel}</span>
                    </button>
                    <span className="r__optimized__text">{rOptimizedConfig.fullLabel}</span>
                    <span className="r__optimized__text__label">R-Optimized</span>
                </ul>
            )}

            <div className="response__container" id={`${responseId}-container`}>
                <textarea
                    id={`${responseId}_text`}
                    className="response__input"
                    cols="40"
                    rows="5"
                    placeholder={`Response ${responseNumber}`}
                    name={`${responseId}_text`}
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                />

                <div className="button__panel">
                    <button
                        type="button"
                        className={`button__panel__svg ${notesOpen ? "button__panel__svg__active" : ""}`}
                        id={`notes__button__${responseId}`}
                        onClick={() => {
                            setNotesOpen((prev) => !prev);
                            setOrientationOpen(false);
                        }}
                        aria-label={`Toggle notes for response ${responseNumber}`}
                    >
                        <NotesIcon />
                    </button>

                    <button
                        type="button"
                        className={`button__panel__svg ${orientationOpen ? "button__panel__svg__active" : ""}`}
                        id={`orientation__button__${responseId}`}
                        onClick={() => {
                            setOrientationOpen((prev) => !prev);
                            setNotesOpen(false);
                        }}
                        aria-label={`Toggle orientation panel for response ${responseNumber}`}
                    >
                        <OrientationPanelIcon />
                    </button>

                    <button
                        type="button"
                        className={`button__panel__svg ${touchActive ? "button__panel__svg__active" : ""}`}
                        id={`touch__button__${responseId}`}
                        onClick={() => setTouchActive((prev) => !prev)}
                        aria-label={`Toggle touch for response ${responseNumber}`}
                    >
                        <input
                            id={`${responseId}_touch`}
                            type="hidden"
                            value={String(touchActive)}
                            name={`${responseId}_touch`}
                        />
                        <TouchIcon />
                    </button>
                </div>
            </div>

            <div
                className={`administration__notes ${notesOpen ? "administration__notes--open" : ""}`}
                id={`notes__panel__${responseId}`}
                aria-hidden={!notesOpen}
            >
                <u>Notes</u>
                <textarea
                    className="notes__input"
                    id={`${responseId}_notes`}
                    cols="30"
                    rows="10"
                    name={`${responseId}_notes`}
                    value={notesText}
                    onChange={(event) => setNotesText(event.target.value)}
                />
            </div>

            <div
                className={`orientation__panel ${orientationOpen ? "orientation__panel--open" : ""}`}
                id={`orientation__panel__${responseId}`}
                aria-hidden={!orientationOpen}
            >
                Card Orientation
                <ul className="orientation__button__list">
                    {ORIENTATION_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={`orientation__button ${orientation === option ? "current-button" : ""}`}
                            value={option}
                            id={`${option.toLowerCase()}__${responseId}`}
                            onClick={() => setOrientation(option)}
                            aria-pressed={orientation === option}
                        >
                            {option === "Up" && (
                                <input
                                    id={`${responseId}_orientation`}
                                    type="hidden"
                                    value={orientation}
                                    name={`${responseId}_orientation`}
                                />
                            )}
                            <OrientationIcon option={option} />
                        </button>
                    ))}
                </ul>
            </div>

            {!isOpen && (
                <div
                    className="response__cover"
                    id={`${responseId}-cover`}
                    onClick={handleOpen}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleOpen();
                        }
                    }}
                >
                    <div className="response__label">Response {responseNumber}</div>
                    <input type="hidden" name={`${responseId}_card`} value={cardCode} />
                </div>
            )}
        </div>
    );
});

export default ResponseBox;