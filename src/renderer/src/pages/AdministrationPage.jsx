import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/AdministrationPage.css";
import leftArrow from "../assets/left.svg";
import rightArrow from "../assets/right.svg";

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

export default function AdministrationPage({
    onNavigateMenu,
    onNavigateInquiry,
    selectedSession = null,
    isSubmitting = false,
}) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showInquiryConfirm, setShowInquiryConfirm] = useState(false);

    const cancelButtonRef = useRef(null);
    const confirmButtonRef = useRef(null);

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
            if (event.key === "Escape" && !isSubmitting) {
                event.preventDefault();
                setShowInquiryConfirm(false);
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = [
                cancelButtonRef.current,
                confirmButtonRef.current,
            ].filter(Boolean);

            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (event.shiftKey) {
                if (active === first) {
                    event.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showInquiryConfirm, isSubmitting]);

    const goToSlide = (index) => {
        if (index < 0 || index >= slides.length) return;
        setCurrentSlide(index);
    };

    const goPrevious = () => {
        if (currentSlide === 0) return;
        setCurrentSlide((prev) => prev - 1);
    };

    const goNext = () => {
        if (currentSlide === slides.length - 1) return;
        setCurrentSlide((prev) => prev + 1);
    };

    const handleOpenInquiryConfirm = () => {
        if (isSubmitting) return;
        setShowInquiryConfirm(true);
    };

    const handleCloseInquiryConfirm = () => {
        if (isSubmitting) return;
        setShowInquiryConfirm(false);
    };

    const handleConfirmInquiry = () => {
        if (isSubmitting) return;
        setShowInquiryConfirm(false);
        onNavigateInquiry?.(selectedSession);
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
                    disabled={currentSlide === 0}
                    aria-label="Previous Card"
                    tabIndex={showInquiryConfirm || currentSlide === 0 ? -1 : 0}
                >
                    <img
                        className="carousel-arrow-icon"
                        src={leftArrow}
                        alt=""
                        aria-hidden="true"
                    />
                </button>

                <div className="carousel">
                    <div className="carousel__track-container">
                        <ul
                            className="carousel__track"
                            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        >
                            {slides.map((slide, index) => {
                                const isFinalSlide = index === slides.length - 1;
                                const isActiveSlide = currentSlide === index;

                                return (
                                    <li
                                        key={slide.id}
                                        className={`carousel__slide ${isActiveSlide ? "current-slide" : ""}`}
                                        aria-hidden={!isActiveSlide}
                                    >
                                        <div className="carousel__slide__interior">
                                            <div className="card-title">{slide.label}</div>

                                            <div className="administration-slide-body">
                                                <div className="response__container rectangle--1">
                                                    <div className="response__cover">
                                                        <div className="response__label">
                                                            Placeholder
                                                            <span className="response__label__inner">
                                                                {" "}Response 1
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="response__container rectangle--2">
                                                    <div className="response__cover">
                                                        <div className="response__label">
                                                            Placeholder
                                                            <span className="response__label__inner">
                                                                {" "}Response 2
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="response__container rectangle--3">
                                                    <div className="response__cover">
                                                        <div className="response__label">
                                                            Placeholder
                                                            <span className="response__label__inner">
                                                                {" "}Response 3
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="response__container rectangle--4">
                                                    <div className="response__cover">
                                                        <div className="response__label">
                                                            Placeholder
                                                            <span className="response__label__inner">
                                                                {" "}Response 4
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {isFinalSlide && (
                                                <div className="transition__button__container">
                                                    <button
                                                        type="button"
                                                        className="transition__button"
                                                        onClick={handleOpenInquiryConfirm}
                                                        aria-label="Begin Inquiry Phase"
                                                        disabled={isSubmitting}
                                                        tabIndex={
                                                            showInquiryConfirm || !isActiveSlide ? -1 : 0
                                                        }
                                                    >
                                                        <span className="vertically_align_text">
                                                            {isSubmitting ? "Loading..." : "Inquiry"}
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
                    disabled={atLastSlide}
                    aria-label="Next Card"
                    tabIndex={showInquiryConfirm || atLastSlide ? -1 : 0}
                >
                    <img
                        className="carousel-arrow-icon"
                        src={rightArrow}
                        alt=""
                        aria-hidden="true"
                    />
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
                        <h2
                            id="administration-inquiry-title"
                            className="administration-page__modal-title"
                        >
                            Begin Inquiry?
                        </h2>

                        <p
                            id="administration-inquiry-text"
                            className="administration-page__modal-text"
                        >
                            Are you sure you want to transition to the Inquiry Phase?
                        </p>

                        <div className="administration-page__modal-actions">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                className="administration-page__modal-button administration-page__modal-button--secondary"
                                onClick={handleCloseInquiryConfirm}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>

                            <button
                                ref={confirmButtonRef}
                                type="button"
                                className="administration-page__modal-button administration-page__modal-button--primary"
                                onClick={handleConfirmInquiry}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Loading..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}