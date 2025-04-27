// import { auth } from "@clerk/nextjs/server"
// import { redirect } from "next/navigation"
// import { LandingHero } from "./component/landingpage"
// import { LandingNavbar } from "./component/landingnavbar"
// import { LandingFeatures } from "./component/landing-features"

// import AudioUpload from "./audioupload/page";
import AudioRecorder from "./audioupload/page"
export default function Home() {
  // const { userId } = auth()

  // if (userId) {
  //   redirect("/dashboard")
  // }

  return (
    <div className="h-full">
   <AudioRecorder />
      {/* <LandingNavbar />
      <LandingHero />
      <LandingFeatures /> */}
    </div>
  )
}
