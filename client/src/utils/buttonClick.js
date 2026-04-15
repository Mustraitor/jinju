export const buttonSound = () => {
    const sound = new Audio('src/assets/sound/buttonclick.ogg')
    sound.volume = 0.5
    sound.play()
}