import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/AdministrationPage.css";
import "../styles/ResponseBox.css";
import leftArrow from "../assets/left.svg";
import rightArrow from "../assets/right.svg";
import ResponseBox from "../components/ResponseBox";

const CARD_LABELS = [
    "Card I",
    "Card II",
    "Card III",
    "Card IV",
    "Card V",
    "Card VI",
    "Card VII",
    "Card VIII",
    "Card IX",
    "Card X",
];

const INITIAL_RESPONSE_COUNT = 4;

function getResponseTopPercent(index) {
    return 10 + 22 * index;
}

function getSlideBodyHeight(count) {
    if (count <= 4) return 520;
    return 520 + (count - 4) * 114;
}

function createInitialResponseSlots() {
    let globalCounter = 1;

    return CARD_LABELS.map(() =>
        Array.from({ length: INITIAL_RESPONSE_COUNT }, (_, index) => {
            const slot = {
                responseNumber: index + 1,
                globalResponseNumber: globalCounter,
            };
            globalCounter += 1;
            return slot;
        })
    );
}

function getInitialNextGlobalResponseNumber() {
    return CARD_LABELS.length * INITIAL_RESPONSE_COUNT + 1;
}

export default function AdministrationPage({
    onNavigateMenu,
    onNavigateInquiry,
    selectedSession = null,
    isSubmitting = false,
}) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showInquiryConfirm, setShowInquiryConfirm] = useState(false);
    const [responseSlotsByCard, setResponseSlotsByCard] = useState(createInitialResponseSlots);
    const [nextGlobalResponseNumber, setNextGlobalResponseNumber] = useState(
        getInitialNextGlobalResponseNumber
    );
    const [scrollTargetByCard, setScrollTargetByCard] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const cancelButtonRef = useRef(null);
    const confirmButtonRef = useRef(null);
    const responseBoxRefs = useRef({});

    const slides = useMemo(
        () =>
            CARD_LABELS.map((label, index) => ({
                id: `card-${index + 1}`,
                label,
            })),
        []
    );

    useEffect(() => {
        if (!showInquiryConfirm) return;

        cancelButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !isSubmitting && !isSaving) {
                event.preventDefault();
                setShowInquiryConfirm(false);
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean);
            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey) {
                if (active === first) {
                    event.preventDefault();
                    last.focus();
                }
            } else if (active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showInquiryConfirm, isSubmitting, isSaving]);

    useEffect(() => {
        if (Object.keys(scrollTargetByCard).length === 0) return;

        const timer = window.setTimeout(() => {
            setScrollTargetByCard({});
        }, 250);

        return () => window.clearTimeout(timer);
    }, [scrollTargetByCard]);

    const setResponseBoxRef = (cardIndex, globalResponseNumber, instance) => {
        if (!responseBoxRefs.current[cardIndex]) {
            responseBoxRefs.current[cardIndex] = {};
        }

        if (instance) {
            responseBoxRefs.current[cardIndex][globalResponseNumber] = instance;
        } else if (responseBoxRefs.current[cardIndex]) {
            delete responseBoxRefs.current[cardIndex][globalResponseNumber];
        }
    };

    const collectResponsesForCard = (cardIndex) => {
        const refsForCard = responseBoxRefs.current[cardIndex] || {};

        return Object.keys(refsForCard)
            .map(Number)
            .sort((a, b) => a - b)
            .map((globalResponseNumber) => {
                const instance = refsForCard[globalResponseNumber];
                return instance?.getResponseData?.();
            })
            .filter(Boolean);
    };

    const saveResponsesForCard = async (cardIndex) => {
        const sessionId = selectedSession?.sessionId;

        if (!sessionId) {
            console.log("[saveResponsesForCard] skipped: no sessionId", { cardIndex });
            return;
        }

        const responses = collectResponsesForCard(cardIndex).filter(
            (response) => response.responseText?.trim()
        );

        if (responses.length === 0) {
            console.log("[saveResponsesForCard] skipped: no non-empty responses", {
                cardIndex,
                cardLabel: slides[cardIndex]?.label,
            });
            return;
        }

        console.log("[saveResponsesForCard] starting", {
            cardIndex,
            cardLabel: slides[cardIndex]?.label,
            responseCount: responses.length,
            responses,
        });

        setIsSaving(true);

        try {
            for (const response of responses) {
                const payload = {
                    sessionId,
                    responseNumber: response.globalResponseNumber,
                    cardNumber: response.cardCode,
                    responseText: response.responseText,
                    responseNotes: response.notesText,
                    orientation: response.orientation,
                    touchedCard: response.touchActive,
                    rOptimized: response.isROptimized,
                };

                console.log("[upsertResponse] sending", payload);

                const result = await window.api.upsertResponse(payload);

                console.log("[upsertResponse] result", {
                    responseNumber: payload.responseNumber,
                    cardNumber: payload.cardNumber,
                    result,
                });

                if (!result?.ok) {
                    throw new Error(result?.error || "response-save-failed");
                }
            }

            console.log("[saveResponsesForCard] complete", {
                cardIndex,
                cardLabel: slides[cardIndex]?.label,
            });
        } catch (error) {
            console.error("[saveResponsesForCard] failed", {
                cardIndex,
                cardLabel: slides[cardIndex]?.label,
                error,
            });
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    const goToSlide = async (index) => {
        if (index < 0 || index >= slides.length || index === currentSlide || isSaving) return;

        console.log("[goToSlide] before save", {
            fromSlide: currentSlide,
            toSlide: index,
            fromCard: slides[currentSlide]?.label,
            toCard: slides[index]?.label,
        });

        await saveResponsesForCard(currentSlide);

        console.log("[goToSlide] after save, changing slide", {
            toSlide: index,
            toCard: slides[index]?.label,
        });

        setCurrentSlide(index);
    };

    const goPrevious = async () => {
        if (currentSlide === 0 || isSaving) return;

        console.log("[goPrevious] before save", {
            currentSlide,
            currentCard: slides[currentSlide]?.label,
        });

        await saveResponsesForCard(currentSlide);

        console.log("[goPrevious] after save, changing slide", {
            nextSlide: currentSlide - 1,
        });

        setCurrentSlide((prev) => prev - 1);
    };

    const goNext = async () => {
        if (currentSlide === slides.length - 1 || isSaving) return;

        console.log("[goNext] before save", {
            currentSlide,
            currentCard: slides[currentSlide]?.label,
        });

        await saveResponsesForCard(currentSlide);

        console.log("[goNext] after save, changing slide", {
            nextSlide: currentSlide + 1,
        });

        setCurrentSlide((prev) => prev + 1);
    };

    const handleOpenInquiryConfirm = () => {
        if (isSubmitting || isSaving) return;
        setShowInquiryConfirm(true);
    };

    const handleCloseInquiryConfirm = () => {
        if (isSubmitting || isSaving) return;
        setShowInquiryConfirm(false);
    };

    const handleConfirmInquiry = async () => {
        if (isSubmitting || isSaving) return;

        console.log("[handleConfirmInquiry] before save", {
            currentSlide,
            currentCard: slides[currentSlide]?.label,
        });

        await saveResponsesForCard(currentSlide);

        console.log("[handleConfirmInquiry] after save, navigating to inquiry", {
            currentSlide,
            currentCard: slides[currentSlide]?.label,
            selectedSession,
        });

        setShowInquiryConfirm(false);
        onNavigateInquiry?.(selectedSession);
    };

    const handleAddResponse = (cardIndex) => {
        const newDisplayResponseNumber = responseSlotsByCard[cardIndex].length + 1;
        const assignedGlobalResponseNumber = nextGlobalResponseNumber;

        setResponseSlotsByCard((prev) => {
            const next = [...prev];
            next[cardIndex] = [
                ...next[cardIndex],
                {
                    responseNumber: newDisplayResponseNumber,
                    globalResponseNumber: assignedGlobalResponseNumber,
                },
            ];
            return next;
        });

        setNextGlobalResponseNumber((prev) => prev + 1);

        setScrollTargetByCard((prev) => ({
            ...prev,
            [cardIndex]: assignedGlobalResponseNumber,
        }));
    };

    const atLastSlide = currentSlide === slides.length - 1;

    return (
        <div className="administration-page">
            <div className="administration-page__topbar">
                <button
                    type="button"
                    className="administration-page__back"
                    onClick={onNavigateMenu}
                    tabIndex={showInquiryConfirm ? -1 : 0}
                    disabled={isSaving}
                >
                    <span className="administration-page__back-icon" aria-hidden="true">
                        &#8592;
                    </span>
                    <span>Return to Menu</span>
                </button>
            </div>

            <header className="administration-page__header">
                <h1 className="administration-page__title">Administration</h1>
                <div className="administration-page__rule" />
            </header>

            <section className="carousel-section" aria-label="Administration carousel">
                <button
                    type="button"
                    className={`carousel__button carousel__button--left ${currentSlide === 0 ? "is-hidden" : ""}`}
                    onClick={goPrevious}
                    disabled={currentSlide === 0 || isSaving}
                    aria-label="Previous Card"
                    tabIndex={showInquiryConfirm || currentSlide === 0 ? -1 : 0}
                >
                    <img className="carousel-arrow-icon" src={leftArrow} alt="" aria-hidden="true" />
                </button>

                <div className="carousel">
                    <div className="carousel__track-container">
                        <ul
                            className="carousel__track"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((slide, index) => {
                                const responseSlots = responseSlotsByCard[index];
                                const slideHeight = getSlideBodyHeight(responseSlots.length);

                                return (
                                    <li
                                        key={slide.id}
                                        className={`carousel__slide ${currentSlide === index ? "current-slide" : ""}`}
                                        aria-hidden={currentSlide !== index}
                                    >
                                        <div className="carousel__slide__interior">
                                            <div className="card-title">{slide.label}</div>

                                            <div
                                                className="administration-slide-body"
                                                style={{
                                                    position: "relative",
                                                    width: "100%",
                                                    height: `${slideHeight}px`,
                                                    margin: "0 auto",
                                                }}
                                            >
                                                {responseSlots.map((slot, responseIdx) => {
                                                    const isLast = responseIdx === responseSlots.length - 1;

                                                    return (
                                                        <ResponseBox
                                                            key={`${slide.id}-global-${slot.globalResponseNumber}`}
                                                            ref={(instance) =>
                                                                setResponseBoxRef(
                                                                    index,
                                                                    slot.globalResponseNumber,
                                                                    instance
                                                                )
                                                            }
                                                            cardIndex={index}
                                                            responseNumber={slot.responseNumber}
                                                            globalResponseNumber={slot.globalResponseNumber}
                                                            topPercent={getResponseTopPercent(responseIdx)}
                                                            isInitiallyOpen={slot.responseNumber === 1}
                                                            showAddButton={isLast}
                                                            onAddResponse={isLast ? () => handleAddResponse(index) : undefined}
                                                            shouldScrollIntoView={
                                                                scrollTargetByCard[index] ===
                                                                slot.globalResponseNumber
                                                            }
                                                        />
                                                    );
                                                })}
                                            </div>

                                            {index === slides.length - 1 && (
                                                <div className="transition__button__container">
                                                    <button
                                                        type="button"
                                                        className="transition__button"
                                                        onClick={handleOpenInquiryConfirm}
                                                        aria-label="Begin Inquiry Phase"
                                                        disabled={isSubmitting || isSaving}
                                                        tabIndex={showInquiryConfirm ? -1 : 0}
                                                    >
                                                        <span className="vertically_align_text">
                                                            {isSubmitting || isSaving ? "Loading..." : "Inquiry"}
                                                        </span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <button
                    type="button"
                    className={`carousel__button carousel__button--right ${atLastSlide ? "is-hidden" : ""}`}
                    onClick={goNext}
                    disabled={atLastSlide || isSaving}
                    aria-label="Next Card"
                    tabIndex={showInquiryConfirm || atLastSlide ? -1 : 0}
                >
                    <img className="carousel-arrow-icon" src={rightArrow} alt="" aria-hidden="true" />
                </button>
            </section>

            <div className="carousel__nav" role="tablist" aria-label="Card navigation">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={currentSlide === index}
                        className={`carousel__indicator ${currentSlide === index ? "current-slide" : ""}`}
                        onClick={() => goToSlide(index)}
                        tabIndex={showInquiryConfirm ? -1 : 0}
                        disabled={isSaving}
                    >
                        <div className="card__style">{slide.label}</div>
                    </button>
                ))}
            </div>

            {showInquiryConfirm && (
                <div
                    className="administration-page__modal-backdrop"
                    role="presentation"
                    onClick={handleCloseInquiryConfirm}
                >
                    <div
                        className="administration-page__modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="administration-inquiry-title"
                        aria-describedby="administration-inquiry-text"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 id="administration-inquiry-title" className="administration-page__modal-title">
                            Begin Inquiry?
                        </h2>

                        <p id="administration-inquiry-text" className="administration-page__modal-text">
                            Are you sure you want to transition to the Inquiry Phase?
                        </p>

                        <div className="administration-page__modal-actions">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                className="administration-page__modal-button administration-page__modal-button--secondary"
                                onClick={handleCloseInquiryConfirm}
                                disabled={isSubmitting || isSaving}
                            >
                                Cancel
                            </button>

                            <button
                                ref={confirmButtonRef}
                                type="button"
                                className="administration-page__modal-button administration-page__modal-button--primary"
                                onClick={handleConfirmInquiry}
                                disabled={isSubmitting || isSaving}
                            >
                                {isSubmitting || isSaving ? "Loading..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}