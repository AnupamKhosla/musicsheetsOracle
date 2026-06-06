'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

function toggleMenu() {
  document.getElementById('isToggle')?.classList.toggle('open');
  var isOpen = document.getElementById('navigation');
  if (isOpen) {
    isOpen.style.display = isOpen.style.display === 'block' ? 'none' : 'block';
  }
}

function getClosest(elem: any, selector: string) {
  for (; elem && elem !== document; elem = elem.parentNode) {
    if (elem.matches(selector)) return elem;
  }
  return null;
}

function activateMenu() {
  var menuItems = document.getElementsByClassName('sub-menu-item');
  if (!menuItems) return;
  var matchingMenuItem: any = null;
  for (var idx = 0; idx < menuItems.length; idx++) {
    if ((menuItems[idx] as HTMLAnchorElement).href === window.location.href) {
      matchingMenuItem = menuItems[idx];
    }
  }
  if (matchingMenuItem) {
    matchingMenuItem.classList.add('active');
    var immediateParent = getClosest(matchingMenuItem, 'li');
    if (immediateParent) immediateParent.classList.add('active');
    var parent = getClosest(immediateParent, '.child-menu-item');
    if (parent) parent.classList.add('active');
    parent = getClosest(parent || immediateParent, '.parent-menu-item');
    if (parent) {
      parent.classList.add('active');
      var parentMenuitem = parent.querySelector('.menu-item');
      if (parentMenuitem) parentMenuitem.classList.add('active');
      var parentOfParent = getClosest(parent, '.parent-parent-menu-item');
      if (parentOfParent) parentOfParent.classList.add('active');
    }
  }
}

export default function Navigation() {
  const [songName, setSongName] = useState('');
  const searchFormRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activateMenu();

    window.onclick = function (event: MouseEvent) {
      document.querySelectorAll('#topnav .navigation-menu > li.has-submenu:hover > .submenu').forEach(function (elem: any) {
        elem.style.display = 'none';
        setTimeout(function () {
          elem.removeAttribute('style');
        }, 200);
      });
      if ((event.target as Element).matches?.('#topnav .navigation-menu > li .submenu li a')) {
        toggleMenu();
      }
    };

    const navEl = document.getElementById('navigation');
    if (navEl) {
      var elements = navEl.getElementsByTagName('a');
      for (var i = 0; i < elements.length; i++) {
        elements[i].onclick = function (elem: any) {
          if (elem.target.getAttribute('href') === '#') {
            var submenu = elem.target.nextElementSibling?.nextElementSibling;
            if (submenu) submenu.classList.toggle('open');
          }
        };
      }
    }
  }, []);

  return (
    <nav id="topnav" className="defaultscroll is-sticky">
      <div className="container relative">
        <Link className="logo" href="/">
          <span className="h1">
            {' '}
            <img className="w-auto h-8 inline" src="/logo.svg" alt="Clef symbol logo" /> MusicSheets
          </span>
        </Link>
        <div className="menu-extras">
          <div className="menu-item">
            <a className="navbar-toggle" id="isToggle" onClick={toggleMenu}>
              <div className="lines">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </a>
          </div>
        </div>
        <ul className="buy-button list-none mb-0">
          <li className="inline-block mb-0">
            <div className="form-icon relative">
              <Link
                href={`/search?songName=${songName}`}
                ref={searchFormRef}
                className="absolute top-1/2 -translate-y-1/2 start-3"
              >
                <i className="uil uil-search text-lg text-rose-600"></i>
              </Link>
              <input
                type="text"
                className="form-input sm:w-44 w-28 ps-10 py-2 px-3 h-10 bg-transparent dark:bg-slate-900 dark:text-slate-200 rounded-3xl outline-none border border-gray-200 focus:border-rose-600 dark:border-gray-800 dark:focus:border-rose-600 focus:ring-0 bg-white"
                name="searchTop"
                id="searchTop"
                placeholder="Search sheet"
                onChange={e => setSongName(e.target.value)}
                onKeyUp={e => {
                  if (e.key === 'Enter') searchFormRef.current?.click();
                }}
              />
            </div>
          </li>
          <li className="inline ps-1 mb-0">
            <Link
              href="/create"
              className="pointer-events-none cursor-not-allowed px-4 h-9 w-auto inline-flex items-center justify-center tracking-wide align-middle transition duration-500 ease-in-out text-base text-center rounded-full bg-rose-600 hover:bg-rose-700 border border-rose-600 hover:border-rose-700 text-white"
            >
              Contribute <i className="uil uil-edit text-lg ml-2"></i>
            </Link>
          </li>
        </ul>

        <div id="navigation" className="z-1">
          <ul className="navigation-menu justify-end">
            <li>
              <Link className="sub-menu-item" href="/">Home</Link>
            </li>
            <li className="has-submenu parent-parent-menu-item">
              <a href="#">Ragas</a><span className="menu-arrow"></span>
              <ul className="submenu megamenu">
                {RAGA_COLUMNS}
              </ul>
            </li>
            <li className="has-submenu parent-menu-item">
              <a href="#">Genres</a><span className="menu-arrow"></span>
              <ul className="submenu">
                {GENRE_ITEMS}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

const RAGAS: [string, string][] = [
  ['Abhogi', 'abhogi'], ['Adana', 'adana'], ['Amritvarshini', 'amritvarshini'], ['Asa', 'asa'],
  ['Asavari', 'asavari'], ['Bageshri', 'bageshri'], ['Bahar', 'bahar'], ['Bairagi', 'bairagi'],
  ['Bairari', 'bairari'], ['Barwa', 'barwa'], ['Basant', 'basant'], ['Ahir Bhairav', 'ahir-bhairav'],
  ['Bhairav', 'bhairav'], ['Sindhu Bhairavi', 'sindhu-bhairavi'], ['Bhairavi', 'bhairavi'],
  ['Bhatiyar', 'Bhatiyar'], ['Bhimpalasi', 'Bhimpalasi'], ['Bhimsen', 'Bhimsen'],
  ['Bhinna Shadja', 'Bhinna%20Shadja'], ['Bhoopali', 'Bhoopali'], ['Bhoopeshwari', 'Bhoopeshwari'],
  ['Bibhas', 'Bibhas'], ['Bihag', 'Bihag'], ['Hem Bihag', 'Hem%20Bihag'], ['Bihagara', 'Bihagara'],
  ['Bilaval', 'Bilaval'], ['Alhaiya Bilaval', 'Alhaiya%20Bilaval'], ['Brindavani Sarang', 'Brindavani%20Sarang'],
  ['Chandrakauns', 'Chandrakauns'], ['Chhayanat', 'Chhayanat'], ['Darbar', 'Darbar'],
  ['Desh', 'Desh'], ['Desi', 'Desi'], ['Dhanashree', 'Dhanashree'], ['Dhani', 'Dhani'],
  ['Puriya Dhanashree', 'Puriya%20Dhanashree'], ['Durga', 'Durga'], ['Gond', 'Gond'],
  ['Gaud Malhar', 'Gaud%20Malhar'], ['Gaud Sarang', 'Gaud%20Sarang'], ['Gauri', 'Gauri'],
  ['Gorakh Kalyan', 'Gorakh%20Kalyan'], ['Gujjari', 'Gujjari'], ['Gunakri', 'Gunakri'],
  ['Gurjari', 'Gurjari'], ['Hameer', 'Hameer'], ['Hindol', 'Hindol'], ['Jaijaivanti', 'Jaijaivanti'],
  ['Jaitsri', 'Jaitsri'], ['Jaunpuri', 'Jaunpuri'], ['Jhinjhoti', 'Jhinjhoti'], ['Jog', 'Jog'],
  ['Jogiya', 'Jogiya'], ['Kafi', 'Kafi'], ['Kalavati', 'Kalavati'], ['Kanada', 'Kanada'],
  ['Darbari Kanada', 'Darbari%20Kanada'], ['Kedar', 'Kedar'], ['Khamaj', 'Khamaj'],
  ['Kirwani', 'Kirwani'], ['Lalit', 'Lalit'], ['Malhar', 'Malhar%20'], ['Malkauns', 'Malkauns'],
  ['Mangala Gujjari', 'Mangala%20Gujjari'], ['Multani', 'Multani'], ['Nat Bhairav', 'Nat%20Bhairav'],
  ['Patdeep', 'Patdeep'], ['Purvi', 'Purvi'], ['Ramkali', 'Ramkali'], ['Shivaranjani', 'Shivaranjani'],
  ['Sohni', 'Sohni'], ['Bilaskhani Todi', 'Bilaskhani%20Todi'], ['Yaman', 'Yaman'], ['Zeelaf', 'Zeelaf'],
];

const COL_SIZE = 15;
const RAGA_COLUMNS = Array.from({ length: Math.ceil(RAGAS.length / COL_SIZE) }, (_, ci) => (
  <li key={ci}>
    <ul>
      {RAGAS.slice(ci * COL_SIZE, (ci + 1) * COL_SIZE).map(([label, value]) => (
        <li key={value}>
          <Link className="sub-menu-item" href={`/search?scaleName=${value}`}>{label}</Link>
        </li>
      ))}
    </ul>
  </li>
));

const GENRES = [
  ['Blues', 'blues'], ['Classical', 'Western%20classical'], ['Country', 'country'],
  ['Disco', 'disco'], ['Electronic', 'electronic'], ['Folk', 'folk'], ['Hip hop', 'hip-Hop'],
  ['Indian', 'Indian'], ['Jazz', 'jazz'], ['Metal', 'metal'], ['Pop', 'pop'], ['Rap', 'rap'],
  ['R&b, Funk & Soul', 'r%26b-funk-soul'], ['Religious Music', 'religious-music'], ['Rock', 'rock'],
];

const GENRE_ITEMS = GENRES.map(([label, value]) => (
  <li key={value}><Link className="sub-menu-item" href={`/search?genre=${value}`}>{label}</Link></li>
));
