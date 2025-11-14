/** @format */

import React from "react";

interface UseOTPParams {
	onSendOTP: (options: { onSuccess: () => void }) => void;
}

export const useOTP = ({ onSendOTP }: UseOTPParams) => {
	const [resendState, setResendState] = React.useState({
		canResend: false,
		timeUntilResendAllowed: 0,
		isTimerRunning: false,
	});

	const resendOTPTimeoutIDRef = React.useRef<NodeJS.Timeout>(undefined);
	const clearResendTimeout = React.useCallback(
		() => clearInterval(resendOTPTimeoutIDRef.current),
		[]
	);
	React.useEffect(() => clearResendTimeout(), [clearResendTimeout]);

	const sendOTP = React.useCallback(() => {
		clearResendTimeout();
		setResendState((prev) => ({
			...prev,
			canResend: false,
		}));

		onSendOTP({
			onSuccess: () => {
				setResendState((prev) => ({
					...prev,
					canResend: false,
					isTimerRunning: true,
					timeUntilResendAllowed: 60,
				}));

				resendOTPTimeoutIDRef.current = setInterval(
					() =>
						setResendState((prevState) => {
							const cloneState = {
								...prevState,
								timeUntilResendAllowed:
									prevState.timeUntilResendAllowed - 1,
							};
							const newTime = cloneState.timeUntilResendAllowed;
							if (newTime <= 0) {
								cloneState.canResend = true;
								cloneState.isTimerRunning = false;
								clearResendTimeout();
							}
							return cloneState;
						}),
					1000
				);
			},
		});
	}, [clearResendTimeout, onSendOTP]);

	return {
		...resendState,
		sendOTP,
	};
};
