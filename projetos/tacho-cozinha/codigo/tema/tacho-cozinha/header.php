<?php
/**
 * Site header.
 *
 * @package tacho
 */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#17130F">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main">Ir para o conteúdo</a>
<header class="site-header">
	<div class="wrap header-row">
		<a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="<?php bloginfo( 'name' ); ?> — início">
			<svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="20" fill="#A8381A"/><path d="M9 17h22l-2 11a4 4 0 0 1-4 3H15a4 4 0 0 1-4-3z" fill="#F4ECDD"/><path d="M14 13c0-3 3-3 3-6m4 6c0-3 3-3 3-6" stroke="#F4ECDD" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
			<span>Tacho<small>cozinha mineira</small></span>
		</a>
		<button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav"><span class="sr">Menu</span><i></i></button>
		<nav id="primary-nav" class="primary-nav" aria-label="Principal">
			<?php
			wp_nav_menu( array(
				'theme_location' => 'primary',
				'container'      => false,
				'fallback_cb'    => 'tacho_fallback_menu',
				'depth'          => 1,
			) );
			?>
			<a class="btn btn-small" href="<?php echo esc_url( home_url( '/#reservas' ) ); ?>">Reservar mesa</a>
		</nav>
	</div>
</header>
<main id="main">
