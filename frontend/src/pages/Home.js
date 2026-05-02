import React, {useState, useEffect} from "react";
//import { H2 } from "@leafygreen-ui/typography";
import PostSummary from "../components/PostSummary";
import SearchForm from "../components/SearchForm";
import { baseUrl } from "../config";
// import opensheetmusicdisplay
import OpenSheetMusicDisplay from "../components/OpenSheetMusicDisplay";


export default function App() {
  let [posts, setPosts] = useState([]);

  useEffect(() => {
    const loadPosts = async () => {
      let results = await fetch(`${baseUrl}/api/posts/latest`).then(resp => resp.json());
      setPosts(results);      
    }

    loadPosts();
  }, []);

  return (
    <React.Fragment>
      <SearchForm />

      <h2 className="text-3xl font-bold mt-6 text-center">Example music sheet</h2>
      <section className="relative">
        <div className="container relative min-h-[40rem]">           
          <OpenSheetMusicDisplay file={"sheets/chopin_op9.xml"} />           
        </div>           
      </section>
      <section className="relative">
        <div className="container relative">            
           
           <div>
            
           </div>
        </div>  
        <div className="container relative">
          <h3 className="text-2xl font-bold text-center">Latest music sheets</h3>
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 mt-8 gap-[30px]">
            {posts.map(post => {
              return(
                <PostSummary {...post} key={post._id} />
              )
            })}   
          </div>            
          <div className="grid md:grid-cols-12 grid-cols-1 mt-8 pb-8">
              <div className="md:col-span-12 text-center">
                  <a 
                    href="/search" 
                    className="relative inline-block font-semibold tracking-wide align-middle 
                               text-base text-center border-none after:content-[''] after:absolute
                               after:h-px after:w-0 hover:after:w-full after:end-0 hover:after:end-auto
                               after:bottom-0 after:start-0 after:transition-all after:duration-500 text-slate-400  
                               hover:text-rose-600 after:bg-rose-600 duration-500 ease-in-out">
                      See all sheets 
                    <i className="uil uil-arrow-right align-middle"></i>
                  </a>
              </div>
          </div>
        </div>    
      </section>
    </React.Fragment>
  )
}