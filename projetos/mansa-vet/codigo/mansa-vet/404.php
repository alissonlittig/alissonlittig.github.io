<?php
/**
 * 404.
 *
 * @package mansa
 */

get_header();
?>
<div class="wrap page narrow">
	<p class="eyebrow">Erro 404</p>
	<h1>Essa página fugiu pela porta.</h1>
	<p>Não achamos o que você procurava. Que tal começar pela página inicial?</p>
	<a class="btn" href="<?php echo esc_url( home_url( '/' ) ); ?>">Voltar ao início</a>
</div>
<?php
get_footer();
