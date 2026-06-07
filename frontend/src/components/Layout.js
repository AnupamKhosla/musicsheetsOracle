import Header from "./Header";
import Navigation from "./Navigation";
// import { css } from "@leafygreen-ui/emotion";
import { Outlet } from "react-router-dom";
import { useState } from "react";


export default function Layout(props) {
  const [searchQuery, searchQueryChanged] = useState(window.location.search);
  const triggerRender = () => {
    searchQueryChanged(window.location.search);    
  }

  return(    
    <div className="gridStyle">
      <section className="headerStyle">        
        <Navigation className="sideNavStyle" triggerRender={triggerRender}/>
      </section>
      

      <section className="mainStyle">
        <Outlet/>
      </section>
      <footer className="py-3 bg-slate-200">
        <div className="container text-sm text-center">
          All rights reserved. Designed and developed solely by <a className="text-rose-500 hover:text-rose-600 underline" href="https://www.linkedin.com/in/anupamkhosla/">Anupam Khosla</a>. The&nbsp;
          <a
            className="text-rose-500 hover:text-rose-600 underline"
            href="https://github.com/AnupamKhosla/musicGitBeanstalk">deisgn and code</a>
          &nbsp;is licenced under CC BY-SA 4.0.          
        </div>
      </footer>  
    </div>
  )
}