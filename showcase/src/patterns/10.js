import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import mojs from "mo-js";
import styles from "./index.css";
import userStyles from "./usage.css";

const INITIAL_STATE = {
  count: 0,
  countTotal: 267,
  isClicked: false,
};

/**
 *  Custom Hook for animation
 */
const useClapAnimation = ({ clapEl, countEl, clapTotalEl }) => {
  const [animationTimeline, setAnimationTimeline] = useState(
    () => new mojs.Timeline()
  );

  useLayoutEffect(() => {
    if (!(clapEl && countEl && clapTotalEl)) {
      return;
    }

    const tlDuration = 300;
    const scaleButton = new mojs.Html({
      el: clapEl,
      duration: tlDuration,
      scale: {
        1.3: 1,
      },
      easing: mojs.easing.ease.out,
    });

    const triangleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 95 },
      count: 5,
      angle: 30,
      children: {
        shape: "polygon",
        radius: { 6: 0 },
        stroke: "rgba(211,54,0,0.5)",
        strokeWidth: 2,
        angle: 210,
        delay: 30,
        speed: 0.2,
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: tlDuration,
      },
    });

    const circleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 75 },
      angle: 25,
      count: 5,
      children: {
        shape: "circle",
        fill: "rgba(149,165,166,0.5)",
        radius: { 3: 0 },
        angle: 210,
        delay: 30,
        speed: 0.2,
        easing: mojs.easing.bezier(0.1, 1, 0.3, 1),
        duration: tlDuration,
      },
    });

    const countAnimation = new mojs.Html({
      el: countEl,
      opacity: { 0: 1 },
      y: { 0: -30 },
      duration: tlDuration,
    }).then({
      opacity: { 1: 0 },
      y: -80,
      delay: tlDuration / 2,
    });

    const countTotalAnimation = new mojs.Html({
      el: clapTotalEl,
      opacity: { 0: 1 },
      delay: (3 * tlDuration) / 2,
      duration: tlDuration,
      y: { 0: -3 },
    });

    clapEl.style.transform = "scale(1,1)";

    const newAnimationTimeline = animationTimeline.add([
      scaleButton,
      countTotalAnimation,
      countAnimation,
      triangleBurst,
      circleBurst,
    ]);
    setAnimationTimeline(newAnimationTimeline);
  }, [clapEl, countEl, clapTotalEl]);

  return animationTimeline;
};

/**
 * useDOMRef Hook
 */
const useDOMRef = () => {
  const [DOMRef, setRefState] = useState({});

  const setRef = useCallback((node) => {
    setRefState((prevRefState) => ({
      ...prevRefState,
      [node.dataset.refkey]: node,
    }));
  }, []);

  return [DOMRef, setRef];
};

/**
 * custom hook for getting previous prop/state
 */
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const callFnsInSequence =
  (...fns) =>
  (...args) => {
    fns.forEach((fn) => fn && fn(...args));
  };
/**
 * Custom Hook for useClapState
 */
const MAXIMUM_USER_CLAP = 30;
const internalReducer = ({ count, countTotal }, { type, payload }) => {
  switch (type) {
    case "clap":
      return {
        isClicked: true,
        count: Math.min(count + 1, MAXIMUM_USER_CLAP),
        countTotal: count < MAXIMUM_USER_CLAP ? countTotal + 1 : countTotal,
      };
    case "reset":
      return payload;
    default:
      break;
  }
};

const useClapState = (
  initialState = INITIAL_STATE,
  reducer = internalReducer()
) => {
  const initialStateRef = useRef(initialState);

  const [clapState, dispatch] = useReducer(reducer, initialState);
  const { count } = clapState;

  const updateClapState = () => dispatch({ type: "clap" });

  const resetRef = useRef(0);
  const prevCount = usePrevious(count);
  const reset = useCallback(() => {
    if (prevCount !== count) {
      dispatch({ type: "reset", payload: initialStateRef.current });
      resetRef.current++;
    }
  }, [initialStateRef, resetRef, prevCount, count, dispatch]);

  // accessibility
  // props collection for 'click'
  const getTogglerProps = ({ onClick, ...otherProps }) => ({
    onClick: callFnsInSequence(updateClapState, onClick),
    "arial-pressed": clapState.isClicked,
    ...otherProps,
  });
  // props collection for 'count'
  const getCounterProps = ({ ...otherProps }) => ({
    count,
    "arial-valuemax": MAXIMUM_USER_CLAP,
    "arial-valuemin": 0,
    "arial-valuenow": count,
    ...otherProps,
  });

  return {
    clapState,
    updateClapState,
    getTogglerProps,
    getCounterProps,
    reset,
    resetDep: resetRef.current,
  };
};

useClapState.reducer = internalReducer;
useClapState.types = {
  clap: "clap",
  reset: "reset",
};

/**
 *  Custom useEffectAfterMount hook
 */
const useEffectAfterMount = (cb, deps) => {
  const componentJustMounted = useRef(true);
  useEffect(() => {
    if (!componentJustMounted.current) {
      return cb();
    }
    componentJustMounted.current = false;
  }, deps);
};

/**
 * subcomponents
 */

const ClapContainer = ({ children, setRef, onClick, ...restProps }) => {
  return (
    <button
      ref={setRef}
      className={styles.clap}
      onClick={onClick}
      {...restProps}
    >
      {children}
    </button>
  );
};

const ClapIcon = ({ isClicked }) => {
  return (
    <span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-549 338 100.1 125"
        className={`${styles.icon} ${isClicked && styles.checked}`}
      >
        <path d="M-471.2 366.8c1.2 1.1 1.9 2.6 2.3 4.1.4-.3.8-.5 1.2-.7 1-1.9.7-4.3-1-5.9-2-1.9-5.2-1.9-7.2.1l-.2.2c1.8.1 3.6.9 4.9 2.2zm-28.8 14c.4.9.7 1.9.8 3.1l16.5-16.9c.6-.6 1.4-1.1 2.1-1.5 1-1.9.7-4.4-.9-6-2-1.9-5.2-1.9-7.2.1l-15.5 15.9c2.3 2.2 3.1 3 4.2 5.3zm-38.9 39.7c-.1-8.9 3.2-17.2 9.4-23.6l18.6-19c.7-2 .5-4.1-.1-5.3-.8-1.8-1.3-2.3-3.6-4.5l-20.9 21.4c-10.6 10.8-11.2 27.6-2.3 39.3-.6-2.6-1-5.4-1.1-8.3z" />
        <path d="M-527.2 399.1l20.9-21.4c2.2 2.2 2.7 2.6 3.5 4.5.8 1.8 1 5.4-1.6 8l-11.8 12.2c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l34-35c1.9-2 5.2-2.1 7.2-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l28.5-29.3c2-2 5.2-2 7.1-.1 2 1.9 2 5.1.1 7.1l-28.5 29.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.4 1.7 0l24.7-25.3c1.9-2 5.1-2.1 7.1-.1 2 1.9 2 5.2.1 7.2l-24.7 25.3c-.5.5-.4 1.2 0 1.7.5.5 1.2.5 1.7 0l14.6-15c2-2 5.2-2 7.2-.1 2 2 2.1 5.2.1 7.2l-27.6 28.4c-11.6 11.9-30.6 12.2-42.5.6-12-11.7-12.2-30.8-.6-42.7m18.1-48.4l-.7 4.9-2.2-4.4m7.6.9l-3.7 3.4 1.2-4.8m5.5 4.7l-4.8 1.6 3.1-3.9" />
      </svg>
    </span>
  );
};

const ClapCount = ({ count, setRef, ...restProps }) => {
  return (
    <span ref={setRef} className={styles.count} {...restProps}>
      + {count}
    </span>
  );
};

const CountTotal = ({ countTotal, setRef, ...restProps }) => {
  return (
    <span ref={setRef} className={styles.total} {...restProps}>
      {countTotal}
    </span>
  );
};

/**
 * Usage
 */
const userInitialState = {
  count: 0,
  countTotal: 1000,
  isClicked: false,
};

const Usage = () => {
  const [timesClapped, setTimeClapped] = useState(0);
  const isClappedTooMuch = timesClapped >= 7;

  const reducer = (state, action) => {
    if (action.type === useClapState.types.clap && isClappedTooMuch) {
      return state;
    }
    return useClapState.reducer(state, action);
  };

  const {
    clapState,
    updateClapState,
    getTogglerProps,
    getCounterProps,
    reset,
    resetDep,
  } = useClapState(userInitialState, reducer);
  const { count, countTotal, isClicked } = clapState;

  const [{ clapRef, clapCountRef, clapTotalRef }, setRef] = useDOMRef();

  const animationTimeline = useClapAnimation({
    clapEl: clapRef,
    countEl: clapCountRef,
    clapTotalEl: clapTotalRef,
  });

  useEffectAfterMount(() => {
    animationTimeline.replay();
  }, [count]);

  const [uploadingReset, setUpload] = useState(false);
  useEffectAfterMount(() => {
    setUpload(true);
    setTimeClapped(0);

    const id = setTimeout(() => {
      setUpload(false);
    }, 3000);

    return () => clearTimeout(id);
  }, [resetDep]);

  const handleClick = () => {
    setTimeClapped((t) => t + 1);
  };

  return (
    <div>
      <ClapContainer
        setRef={setRef}
        data-refkey="clapRef"
        {...getTogglerProps({
          "aria-pressed": false,
          onClick: handleClick,
        })}
      >
        <ClapIcon isClicked={isClicked} />
        <ClapCount
          setRef={setRef}
          data-refkey="clapCountRef"
          {...getCounterProps()}
        />
        <CountTotal
          countTotal={countTotal}
          setRef={setRef}
          data-refkey="clapTotalRef"
        />
      </ClapContainer>
      <section>
        <button onClick={reset} className={userStyles.resetBtn}>
          reset
        </button>
        <pre className={userStyles.resetMsg}>
          {JSON.stringify({ timesClapped, count, countTotal })}
        </pre>
        <pre className={userStyles.resetMsg}>
          {uploadingReset ? `uploading reset ${resetDep} ...` : ""}
        </pre>
        <pre>
          {isClappedTooMuch
            ? `You have clapped too much. Don't be so generous!`
            : ""}
        </pre>
      </section>
    </div>
  );
};

export default Usage;
