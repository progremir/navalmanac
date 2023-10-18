import styles from '../styles/Home.module.css'

interface NavbarProps {
  language: string;
  onChangeLanguage: (selectedLanguage: string) => void;
}

function Navbar({ language, onChangeLanguage }: NavbarProps) {
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeLanguage(e.target.value);
  };

  return (
    <nav>
      <div className={styles.languagedropdown}>
        <select
          id="language-select"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
    </nav>
  );
}

export default Navbar;
