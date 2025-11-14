/** @format */

import { Outlet } from "react-router";
import Footer from "./sections/footer";
import Navbar from "./sections/header";
import "../../utils/styles.css";

export default function LandingLayout() {
	return (
		<>
			<Navbar />
			<Outlet />
			<Footer />
		</>
	);
}
