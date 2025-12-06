import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import About from './components/About'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import Partners from './components/Partners'
import Contact from './components/Contact'
import Footer from './components/Footer'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      <Hero />
      <About />
      <Features />
      <Pricing />
      <Testimonials />
      <Partners />
      <Contact />
      <Footer />
    </div>
  )
}

export default LandingPage