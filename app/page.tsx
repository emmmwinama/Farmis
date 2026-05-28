import LandingPage from "./landing/page";
import {redirect} from "next/navigation";

export default function Home() {
  // return <LandingPage />;
  redirect("/landing")
}
